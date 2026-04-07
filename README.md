# FitTrack

A modern, highly responsive, and comprehensive web application for tracking your fitness journey. With built-in integrations for managing daily activities, tracking your BMI, following tailored recommendations, and pursuing weekly fitness goals.

## Important Note

This is a **Firebase** powered application utilizing Firestore, Auth, and Storage.

## Run Locally

**Prerequisites:** Node.js, npm, Java (for Firebase emulators)

1. **Install dependencies:**
   `npm install`

2. **Configure Environment:**
   If running locally against Firebase Emulators, ensure `.env` file maps your API keys appropriately (they can be dummy keys when running emulators).

3. **Start the Local Firebase Emulator Suite:**
   `npm run emulators`
   *(This launches the Auth, Firestore, and Storage emulators on your loopback).*

4. **Start the Frontend Development Server:**
   `npm run dev`

5. **Access the application!**
   Navigate to `http://localhost:3000` via your web browser.

## Features

- **Activity Tracking Engine**: Log your daily exercise, track active minutes, and maintain streaks.
- **Dynamic Weekly Goals**: Set and monitor your weekly activity quotas with visually engaging progression charts.
- **Biometric Calculations**: Deeply integrated BMI calculation mapping metric and imperial conversions seamlessly.
- **Tailored Recommendations**: Discover new exercises via the "Recommended for You" panel, offering ~40 structured exercises filtering by Goal Types, Difficulty, and Activity Category.
- **Milestone Achievements**: Unlock motivational badges based on consistency and logged time.
- **Light/Dark Accessibility**: Fully customized Dark and Light themes leveraging Framer Motion and Tailwind variables for a premium visual experience.

## Building for Production

If you wish to deploy FitTrack to a production environment:
1. Double-check `firebase.json` for proper hosting targets.
2. Run `npm run build` to bundle your front-end using Vite.
3. Deploy to your provider (e.g. `firebase deploy`).
