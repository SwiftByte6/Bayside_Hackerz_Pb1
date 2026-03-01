<div align="center">

# 🛡️ VibeAudit

**Production-grade AI Code Scanner**  
Detects secrets, vulnerabilities, and compliance violations *before* they reach production.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-teal?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

<br />

## ⚡ Overview

VibeAudit is an advanced, AI-powered cybersecurity scanner designed to audit GitHub repositories automatically. It acts as an intelligent pipeline that inspects your codebase across multiple layers—Analytics, Security, Compliance, and Reporting. 

Built with premium SaaS aesthetics inspired by cutting-edge web design (e.g., Anima & Wondermakers), VibeAudit features a fluid, dynamic UI with scroll-triggered animations, active matrix/CRT overlays, and a live agent pipeline visualizer.

🎥 **Watch the Demo:** [https://youtu.be/jw60XrbzuM0](https://youtu.be/jw60XrbzuM0)

<br />

## ✨ Key Features

- **Live Agent Pipeline:** Watch the AI at work in real-time. Our fully animated pipeline simulates four specialized agents (`David: Analytics`, `Eva: Security`, `Ben: Compliance`, `Austin: Reporter`) auditing your code and analyzing findings dynamically.
- **Deep Security Scans:** Exposes embedded AWS Secret Keys, OpenAI Tokens, DB Passwords, SQL Injection patterns, and hallucinatory dependencies.
- **GDPR & PII Compliance Tracking:** Checks for data logging and PII leaks, alerting you before sensitive data enters a log stream.
- **Premium Dark UI / Glassmorphism:** State-of-the-art interface utilizing deep purples (`#8b5cf6`, `#6d28d9`), neon glows, custom interactive cursors, and sweeping "scanline" loaders.
- **Dynamic Security Ticker:** Real-time scrolling threat status monitor integrated flawlessly into the layout.

<br />

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repo**
   ```sh
   git clone https://github.com/SwiftByte6/Bayside_Hackerz_Pb1.git
   cd Bayside_Hackerz_Pb1
   ```

2. **Start the Development Servers**

   VibeAudit consists of a UI layer and a Backend engine. You must run both concurrently.

   **Terminal 1 (UI Frontend):**
   ```sh
   cd ui
   npm install
   npm run dev
   ```

   **Terminal 2 (Backend):**
   ```sh
   cd backend
   npm install
   npm run dev
   ```

3. **Open the app:**
   Open your browser and navigate to `http://localhost:3003`.

<br />

## 🎨 UI Architecture highlight

VibeAudit utilizes **Framer Motion** extensively to bring its interface to life. Notable implementations include:
- `AgentPipelineDemo.tsx`: Complex sequenced orchestration animating the execution and log streaming of parallel simulated AI agents.
- **Custom Cursor Hook:** A bespoke trailing ring that smoothly follows the cursor and elegantly absorbs into interactive elements (`.interactive-hover`, `.btn-fill`).
- **Interactive Modals & Badges:** Fluid `whileHover` spring physics mixed with animated gradient masks.

<br />

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<br />

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ by Bayside Hackerz</sub>
</div>
