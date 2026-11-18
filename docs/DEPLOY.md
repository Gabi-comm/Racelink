# Deploying RaceLink on AWS

Region used throughout: **Asia Pacific (Singapore) `ap-southeast-1`**. Pick it in the top-right of the AWS console before you start, and keep it the same for every service.

What you'll build:

- **VPC** with 2 public subnets (EC2) and 2 private subnets (RDS)
- **EC2** (Amazon Linux 2023) running the Next.js app with PM2, behind Nginx on port 80
- **RDS MySQL 8.4** in the private subnets, reachable only from the EC2 server
- **S3** private bucket for banners, race files and receipts
- **IAM role** on the EC2 server for S3 access, so no access keys anywhere

Keep a notepad open. You'll collect: the **RDS endpoint**, **RDS password**, **bucket name** and **Elastic IP**.

---

## 1. VPC

1. Open **VPC → Create VPC**, choose **VPC and more**.
2. Name tag: `racelink`. IPv4 CIDR: `10.0.0.0/16`.
3. Availability Zones: **2**. Public subnets: **2**. Private subnets: **2**.
4. NAT gateways: **None**. VPC endpoints: **None**.
5. Leave **Enable DNS hostnames** and **Enable DNS resolution** checked. Click **Create VPC**.

## 2. Security groups

In **EC2 → Security Groups → Create security group** (VPC: `racelink-vpc`):

**`racelink-web-sg`** (for the EC2 server), inbound rules:

| Type | Port | Source |
| --- | --- | --- |
| SSH | 22 | My IP |
| HTTP | 80 | Anywhere-IPv4 |

**`racelink-db-sg`** (for RDS), inbound rule:

| Type | Port | Source |
| --- | --- | --- |
| MYSQL/Aurora | 3306 | `racelink-web-sg` (pick the security group, not an IP) |

## 3. S3 bucket

1. **S3 → Create bucket**. Name: `racelink-uploads-<your-group-name>` (must be globally unique, lowercase).
2. Region: `ap-southeast-1`. Object Ownership: **ACLs disabled**.
3. **Block all public access: ON** (files are shared with short-lived signed links, never publicly).
4. Leave encryption as default (SSE-S3). Create.

You'll add the CORS rule in step 8, after you have the server's IP.

## 4. IAM role for the server

1. **IAM → Policies → Create policy → JSON**, paste (replace the bucket name):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::racelink-uploads-<your-group-name>/*"
       }
     ]
   }
   ```

   Name it `racelink-s3-access`.
2. **IAM → Roles → Create role**. Trusted entity: **AWS service**, use case **EC2**.
3. Attach `racelink-s3-access`. Role name: `racelink-ec2-role`. Create.

## 5. RDS MySQL

1. **RDS → Subnet groups → Create DB subnet group**. Name `racelink-db-subnets`, VPC `racelink-vpc`, pick both Availability Zones, then select the **two private subnets** only.
2. **RDS → Create database → Standard create**:
   - Engine: **MySQL**, version **8.4.x**. Template: **Free tier**.
   - DB instance identifier: `racelink-db`. Master username: `admin`. **Self managed** password: write it down.
   - Instance: `db.t4g.micro` (or `db.t3.micro`). Storage: 20 GiB gp3, uncheck storage autoscaling.
   - Connectivity: **Don't connect to an EC2 compute resource**. VPC `racelink-vpc`, subnet group `racelink-db-subnets`, **Public access: No**.
   - VPC security group: choose existing, `racelink-db-sg` only (remove `default`).
   - **Additional configuration → Initial database name: `racelink_v2`**.
3. Create. It takes about 10 minutes. When the status is **Available**, copy the **Endpoint** from the Connectivity tab.

## 6. EC2 server

1. **EC2 → Launch instance**. Name: `racelink-web`.
2. AMI: **Amazon Linux 2023**. Instance type: `t3.micro` (free tier).
3. Key pair: **Create new key pair** `racelink-key`, RSA, `.pem`. Save it somewhere safe. **Never put it in the repo.**
4. Network settings → **Edit**: VPC `racelink-vpc`, subnet: one of the **public** subnets, **Auto-assign public IP: Enable**, existing security group `racelink-web-sg`.
5. Storage: **16 GiB** gp3.
6. **Advanced details → IAM instance profile: `racelink-ec2-role`**.
7. Launch.

## 7. Elastic IP

So the address doesn't change when the server restarts:

1. **EC2 → Elastic IPs → Allocate Elastic IP address → Allocate**.
2. Select it → **Actions → Associate** → instance `racelink-web`.
3. Write down the IP. From here on it's `<EIP>`.

## 8. S3 CORS

Browsers upload straight to S3, so the bucket has to accept requests from the site.
**S3 → your bucket → Permissions → CORS → Edit**:

```json
[
  {
    "AllowedOrigins": ["http://<EIP>"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

The origin must match exactly: `http://`, no trailing slash.

## 9. Connect to the server

From PowerShell, in the folder with the key:

```powershell
ssh -i racelink-key.pem ec2-user@<EIP>
```

If it says the key permissions are too open, run this once and try again:

```powershell
icacls racelink-key.pem /inheritance:r
icacls racelink-key.pem /grant:r "$($env:USERNAME):(R)"
```

## 10. Install Node, Git, Nginx and PM2

On the server:

```bash
sudo dnf update -y
sudo dnf install -y git nginx
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
sudo npm install -g pm2
node -v
```

`node -v` should print `v22.x`.

The build needs more than the 1 GB of memory a t3.micro has, so add 2 GB of swap:

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
```

## 11. Get the code and set the environment

```bash
git clone https://github.com/Gabi-comm/Racelink.git racelink
cd racelink
openssl rand -base64 32
```

Copy the random string `openssl` printed, then create the env file:

```bash
nano .env.local
```

```env
DB_HOST=<RDS endpoint>
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=<RDS password>
DB_NAME=racelink_v2
DB_SSL=true

BETTER_AUTH_SECRET=<the random string>
BETTER_AUTH_URL=http://<EIP>

AWS_REGION=ap-southeast-1
S3_BUCKET=<bucket name>
```

Save with `Ctrl+O`, `Enter`, `Ctrl+X`. This file stays on the server only; it's gitignored.

## 12. Install, create the tables, load sample data, build

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run build
```

- `db:migrate` creates the tables from `database/migrations`.
- `db:seed` loads `database/seed.sql` (sample races and the demo accounts). **It wipes existing data**, so run it only once.

## 13. Run it with PM2

```bash
pm2 start npm --name racelink -- start
pm2 save
pm2 startup
```

`pm2 startup` prints a `sudo env PATH=...` command. Copy and run it, so the app starts again after a reboot.

## 14. Nginx in front

```bash
sudo nano /etc/nginx/conf.d/racelink.conf
```

```nginx
server {
    listen 80;
    server_name <EIP>;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

## 15. Check it works

1. Open `http://<EIP>`. The landing page should list the sample races.
2. Log in as `admin@racelink.test` / `racelink123`, then go to **Profile** and **change the password right away**.
3. Log in as `organizer@racelink.test`, edit a race and upload a banner. Then open the bucket in S3: the file should be under `banners/`.
4. Log in as a runner, register for a race with a receipt image, then approve it as the organizer.

## Updating after new commits

```bash
cd ~/racelink
git pull
npm ci
npm run db:migrate
npm run build
pm2 restart racelink
```

## Troubleshooting

| Problem | Check |
| --- | --- |
| `502 Bad Gateway` | The app isn't running: `pm2 status`, then `pm2 logs racelink`. |
| Page loads but login fails | `BETTER_AUTH_URL` must be exactly `http://<EIP>`. After editing `.env.local`, run `pm2 restart racelink`. |
| Upload fails, CORS error in the browser console | The CORS origin in step 8 must be exactly `http://<EIP>`. |
| Upload fails with `AccessDenied` | The role is attached to the instance (step 6.6), and the bucket name in the policy and in `.env.local` match. |
| `db:migrate` hangs or times out | `racelink-db-sg` allows 3306 from `racelink-web-sg`, and the RDS endpoint is correct. |
| `npm run build` is killed | The swap from step 10 isn't on: `free -h` should show 2 GB of swap. |

## After grading (avoid charges)

Delete the RDS database, terminate the EC2 instance, **release the Elastic IP**, and empty and delete the bucket.
