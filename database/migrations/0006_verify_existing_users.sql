-- email verification is now required to log in; accounts made before this keep working
UPDATE `user` SET `email_verified` = true WHERE `email_verified` = false;
