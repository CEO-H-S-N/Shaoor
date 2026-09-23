# Shaoor Platform Setup Guide 🚀

To get the platform fully functional and ready for production, you need to configure a few external services. This guide will walk you through setting up each required service, specifically focusing on free tiers where possible. 

Once you have these credentials, you will add them to your `.env.local` file in both the `frontend/` and `backend/` directories.

---

## 1. Google OAuth (For Google Login)

This enables users to log in with their Google accounts.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project drop-down at the top and select **New Project**. Name it "Shaoor" and click Create.
3. Once the project is created, select it.
4. Go to **APIs & Services > OAuth consent screen** from the left menu.
5. Choose **External** and click **Create**.
6. Fill in the required fields (App name: "Shaoor", User support email: your email, Developer contact email: your email). Click Save and Continue through the rest of the steps.
7. Go to **APIs & Services > Credentials**.
8. Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
9. Select **Web application** as the Application type. Name it "Shaoor Web".
10. Under **Authorized redirect URIs**, click **ADD URI** and enter: 
    `http://localhost:3000/api/auth/callback/google` *(You will add your production URL here later, e.g., `https://shaoor.org/api/auth/callback/google`)*.
11. Click **Create**. A modal will appear with your **Client ID** and **Client Secret**.
    
> [!IMPORTANT]
> Save the **Client ID** as `GOOGLE_CLIENT_ID` and the **Client Secret** as `GOOGLE_CLIENT_SECRET`.

---

## 2. ORCID OAuth (For Academic Login)

This allows researchers to log in using their standard ORCID credentials.

1. Go to the [ORCID Developer Tools](https://orcid.org/developer-tools) and log in or register for an ORCID account if you don't have one.
2. Navigate to **Developer Tools** in your account settings.
3. Click **Register for the free Public API**.
4. Read and agree to the terms of service.
5. Fill out the application details:
   - **Name:** Shaoor
   - **Website URL:** `http://localhost:3000` (Update to production URL later)
   - **Description:** Academic paper submission and peer review platform.
   - **Redirect URIs:** `http://localhost:3000/api/auth/callback/orcid`
6. Click **Save**. You will be provided with a **Client ID** and **Client Secret**.

> [!IMPORTANT]
> Save the **Client ID** as `ORCID_CLIENT_ID` and the **Client Secret** as `ORCID_CLIENT_SECRET`.

---

## 3. Google Gemini API (For AI Assistant)

This powers the AI Assistant sidebar on the platform.

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Accept the terms of service if prompted.
3. Click on **Get API key** in the left navigation menu.
4. Click the **Create API key** button.
5. Choose the "Shaoor" project you created earlier (or create a new one).
6. Copy the generated API key.

> [!IMPORTANT]
> Save this key as `GOOGLE_GENERATIVE_AI_API_KEY`.

---

## 4. AWS RDS PostgreSQL Database

This stores all users, papers, reviews, and categories.

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Search for **RDS** and open the RDS dashboard.
3. Click **Create database**.
4. Choose **Standard create**.
5. Select **PostgreSQL** as the engine type. Leave the version as default (usually 16.x or 15.x).
6. Under **Templates**, select **Free tier** (this is crucial to avoid charges).
7. Under **Settings**:
   - DB instance identifier: `shaoor-db`
   - Master username: `postgres`
   - Master password: Create a strong password (e.g., `ShaoorDbPass2026!`)
8. Under **Instance configuration**, ensure `db.t3.micro` or `db.t4g.micro` is selected.
9. Under **Storage**, disable "Enable storage autoscaling" to ensure you stay strictly within the 20GB free tier.
10. Under **Connectivity**:
    - **Public access**: Select **Yes** (required if Vercel needs to connect directly to it, or for running locally).
    - Create a new VPC security group named `shaoor-db-sg`.
11. Scroll down and click **Create database**. This takes a few minutes.
12. Once the status is "Available", click on the database name (`shaoor-db`).
13. Under the **Connectivity & security** tab, copy the **Endpoint**.
14. Your connection string will look like this:
    `postgresql://[username]:[password]@[endpoint]:5432/postgres?schema=public`
    *(Example: `postgresql://postgres:ShaoorDbPass2026!@shaoor-db.abcdefg.us-east-1.rds.amazonaws.com:5432/postgres?schema=public`)*

> [!CAUTION]
> By default, the security group might block your IP. Click the security group link under "Connectivity & security", edit the Inbound Rules, and add a rule for PostgreSQL (Port 5432) allowing source `0.0.0.0/0` (for testing/Vercel) or just your specific IP.
>
> Save the connection string as `DATABASE_URL`.

---

## 5. AWS S3 and IAM Credentials

This is used for secure paper uploads.

1. In the AWS Console, search for **S3** and open it.
2. Click **Create bucket**.
3. Name it something unique like `shaoor-papers-[your-name]`. Leave the region as default (e.g., us-east-1).
4. Leave **Block all public access** checked (our app uses secure pre-signed URLs, so files remain private).
5. Click **Create bucket**. Save the bucket name as `AWS_S3_BUCKET_NAME`.
6. Now, search for **IAM** in the AWS Console.
7. Go to **Users** in the left menu and click **Create user**.
8. Name the user `shaoor-app` and click Next.
9. Select **Attach policies directly**.
10. Search for and select **AmazonS3FullAccess** (for a production environment, you should create a stricter policy, but this works for now).
11. Click **Next**, then **Create user**.
12. Click on the newly created `shaoor-app` user.
13. Go to the **Security credentials** tab.
14. Scroll down to **Access keys** and click **Create access key**.
15. Choose **Application running outside AWS**, click Next, then **Create access key**.
16. Copy both keys immediately.

> [!IMPORTANT]
> Save the Access Key as `AWS_ACCESS_KEY_ID` and the Secret Access Key as `AWS_SECRET_ACCESS_KEY`.

---

## 6. Authentication Secret

This secures the user sessions.

1. Generate a random 32-character string. You can use an online generator or run this command in your terminal:
   `openssl rand -base64 32`
2. Save the output as `AUTH_SECRET`.

---

## ✅ Finalizing Your `.env.local`

Once you have gathered all these, your `frontend/.env.local` file should look like this:

```env
AUTH_SECRET="your-random-32-char-string-here"

GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

ORCID_CLIENT_ID="your-orcid-client-id"
ORCID_CLIENT_SECRET="your-orcid-client-secret"

DATABASE_URL="postgresql://postgres:yourpassword@shaoor-db...rds.amazonaws.com:5432/postgres?schema=public"

GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"

AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET_NAME="shaoor-papers-xyz"
AWS_REGION="us-east-1"
```

Let me know once you have this file set up! We can then run `npx prisma migrate deploy` to set up the database tables and create your Designer admin account.
