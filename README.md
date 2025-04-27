# Resource Booking System 📅

Hey there! Welcome to our Resource Booking System - a simple, user-friendly way to manage bookings for rooms, equipment, or any shared resources. Whether you're running a community center, managing office spaces, or organizing shared equipment, this app has got you covered!

## ✨ What's in the box?

- 🔐 Simple login with email or your Google account
- 📆 Easy-to-use calendar to quickly spot what's available
- 📱 Works great on your phone or computer
- 👤 Personal profile to track all your bookings
- 📝 History of your past bookings (so you don't double-book!)
- 🔄 Real-time updates thanks to Firebase

## 🛠️ Under the hood

We've kept things simple with:
- Plain old HTML, CSS, and JavaScript - no fancy frameworks
- Tailwind CSS for making everything look pretty
- Firebase for handling users and storing data

## 🚀 Getting started

### What you'll need

- A modern web browser (Chrome, Firefox, Edge, etc.)
- A Firebase account (don't worry, the free tier is plenty)

### Setting things up

1. Grab the code:
   ```
   git clone https://github.com/Subhro91/CommunityBookings.git
   cd CommunityBookings
   ```

2. Set up Firebase (it's easier than it sounds!):
   - Head over to [Firebase Console](https://console.firebase.google.com/) and create a project
   - Turn on Authentication with Email/Password and Google
   - Create a Firestore Database
   - Copy the template file and add your configuration:
     ```
     cp src/firebase-config.template.js src/firebase-config.js
     ```
   - Edit `src/firebase-config.js` with your Firebase project details

3. Don't forget the security rules:
   - Upload the `firestore.rules` file to your Firebase project
   - Set up the indexes from `firestore.indexes.json`

### Running the app locally

Pick your favorite method:

- **Python fan?** Open terminal, type:
  ```
  cd public
  python -m http.server
  ```

- **Node.js enthusiast?** Try:
  ```
  npx http-server public
  ```

- **VSCode user?** Just right-click on `public/index.html` and select "Open with Live Server"

## 📁 How it's organized

```
project-root/
├── public/                   ← HTML and CSS live here
│   ├── index.html            ← Main booking page
│   ├── admin.html            ← Admin dashboard
│   └── styles/               
│       └── main.css          ← Makes everything pretty
├── src/                      ← All the JavaScript magic
│   ├── calendar.js           ← Handles the calendar display
│   ├── booking-form.js       ← Takes care of creating bookings
│   ├── auth.js               ← Manages logging in/out
│   ├── admin.js              ← Admin superpowers
│   ├── profile.js            ← User profile stuff
│   ├── firebase-config.template.js ← Template for Firebase config
│   └── firebase-config.js    ← Your Firebase connection (gitignored)
├── firestore.rules           ← Keeps your data secure
├── firestore.indexes.json    ← Makes searches super fast
└── README.md                 ← You are here! 👋
```

## 🔐 Security Best Practices

### Protecting API Keys and Secrets

This project follows these security best practices:

1. **Never commit sensitive data**: The `firebase-config.js` file containing API keys is excluded in `.gitignore`
2. **Use a template file**: We provide `firebase-config.template.js` as a reference without actual credentials
3. **Firestore Security Rules**: Protect your database with the included security rules
4. **Production environments**: In production, consider:
   - Using environment variables when deploying to hosting services
   - Enabling Firebase App Check to prevent API abuse
   - Implementing IP restrictions for your Firebase project
   - Setting up monitoring for suspicious activities

### Revoking Compromised Credentials

If you accidentally expose API keys:
1. Immediately revoke the key in Firebase Console
2. Generate a new key
3. Update your local `firebase-config.js` file
4. Deploy the updated configuration to production

## 🌐 Sharing with the world

### Firebase Hosting (super easy!)

1. Install Firebase tools: `npm install -g firebase-tools`
2. Log in with: `firebase login`
3. Set things up: `firebase init`
4. Make it live: `firebase deploy`

### Vercel (also pretty easy)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Tell it to serve from the `public` directory
4. Hit deploy!

## 📝 License

This project is licensed under the MIT License - which basically means you can do whatever you want with it. Have fun!

## 👏 Thanks to

- [Tailwind CSS](https://tailwindcss.com/) for making CSS bearable
- [Firebase](https://firebase.google.com/) for handling all the backend stuff
- [Font Awesome](https://fontawesome.com/) for the pretty icons

---

Made with ❤️ and a lot of ☕ 