// bump the version when the terms change: every runner is asked to consent again
export const TERMS_VERSION = "2026-11-24";

export const TERMS_SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. About RaceLink",
    body: [
      "RaceLink lets runners register for races, pay entry fees and follow their registration. Races are run by their organizers. RaceLink is the platform you register through.",
    ],
  },
  {
    title: "2. Your account",
    body: [
      "Give your real name and correct contact details. Keep your password private, and tell us if you think someone else used your account.",
      "One account per person. We can suspend accounts that give false details or misuse the platform.",
    ],
  },
  {
    title: "3. Registration and payment",
    body: [
      "A registration is confirmed only after the organizer checks and approves your payment receipt. Your bib number is assigned on approval.",
      "Upload a real, readable receipt for the full entry fee. Edited or fake receipts are rejected and the account may be suspended.",
    ],
  },
  {
    title: "4. Cancellations and refunds",
    body: [
      "You can cancel a paid registration and request a refund from My Bookings. The organizer reviews each request and sends the refund to the contact details you give.",
      "Refunds follow the organizer's policy and may take several days. If the organizer cancels a race, you can request a refund for that race.",
    ],
  },
  {
    title: "5. Health and safety",
    body: [
      "Running is physically demanding. You confirm that you are fit to take part in the distance you register for, and you follow the organizer's race-day rules and marshals.",
      "You take part at your own risk. The organizer and RaceLink are not liable for injury, loss or damage, except where the law says otherwise.",
    ],
  },
  {
    title: "6. Your personal data",
    body: [
      "We collect your name, email, mobile number, birthdate, gender, emergency contact and payment receipts to run your registration. We share them only with the organizer of the race you join.",
      "We process your data under the Data Privacy Act of 2012 (Republic Act No. 10173). You can ask to see, correct or delete your data by emailing racelinkcc@gmail.com.",
    ],
  },
  {
    title: "7. Changes to these terms",
    body: ["If these terms change, we'll ask you to read and accept them again before you continue."],
  },
];
