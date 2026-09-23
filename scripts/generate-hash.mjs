import bcryptjs from "bcryptjs";

const password = "Admin123";
const saltRounds = 10;

async function generateHash() {
  try {
    const hash = await bcryptjs.hash(password, saltRounds);
    console.log("Password:", password);
    console.log("Hashed Password:", hash);
    console.log("\nGunakan hash ini di database:");
    console.log(`UPDATE users SET password = '${hash}' WHERE username = 'admin3@gereja.com';`);
  } catch (error) {
    console.error("Error generating hash:", error);
  }
}

generateHash();
