# 🔒 reCAPTCHA Setup Guide

## How to Enable reCAPTCHA (Optional - For Spam Protection)

### Step 1: Get Your reCAPTCHA Site Key

1. Go to: https://www.google.com/recaptcha/admin/create
2. Sign in with your Google account
3. Fill out the form:
   - **Label:** "ZoukhDev Portfolio Contact Form"
   - **reCAPTCHA type:** Select "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - **Domains:** 
     - `localhost` (for development)
     - Your production domain (e.g., `yourdomain.vercel.app`)
4. Accept terms and click **Submit**
5. Copy your **Site Key** (looks like: `6LeXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### Step 2: Add to .env File

Add this line to your `.env` file:
```
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

### Step 3: Uncomment reCAPTCHA Code

In `src/sections/Contact.jsx`, find this commented section and uncomment it:

```javascript
{/* reCAPTCHA - Uncomment when you get your site key */}
{/* 
<div className="flex justify-center">
  <ReCAPTCHA
    ref={recaptchaRef}
    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
    onChange={onRecaptchaChange}
    theme="dark"
  />
</div>
*/}
```

Also uncomment the validation check in handleSubmit:
```javascript
// if (!recaptchaToken) {
//   showAlert({
//     show: true,
//     text: 'Please verify you are not a robot',
//     type: 'danger',
//   });
//   return;
// }
```

### Step 4: Restart Dev Server

After adding the key:
1. Stop the dev server (Ctrl+C)
2. Run `npm run dev` again
3. The reCAPTCHA widget will appear on your contact form!

---

## Note

reCAPTCHA is **optional**. Your contact form works perfectly without it. Only enable it if you start receiving spam messages.

