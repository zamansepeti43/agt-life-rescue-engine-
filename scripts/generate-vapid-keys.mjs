import { createECDH, randomBytes } from "node:crypto";
const b64=(b)=>Buffer.from(b).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
const e=createECDH("prime256v1");e.generateKeys();
console.log("VAPID_PUBLIC_KEY="+b64(e.getPublicKey(undefined,"uncompressed")));
console.log("VAPID_PRIVATE_KEY="+b64(e.getPrivateKey()));
console.log("VAPID_SUBJECT=mailto:your-email@example.com");
console.log("CRON_SECRET="+b64(randomBytes(24)));