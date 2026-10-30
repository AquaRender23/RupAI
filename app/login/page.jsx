
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChartNoAxesCombined,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    alert("RupAI login authentication will be connected soon!");
  }

  return (
    <main className="login-background min-h-screen flex items-center justify-center p-4">

      {/* Background overlay */}
      <div className="login-overlay" />

      {/* Main centered login box */}
      <section className="login-card relative z-10">

        {/* LEFT PANEL */}
        <div className="login-left">

          <div className="brand-content">

            <ChartNoAxesCombined
              size={55}
              strokeWidth={1.8}
              className="text-cyan-400"
            />

            <h1 className="brand-name">
              Rup<span>AI</span>
            </h1>

            <p className="brand-tagline">
              Connecting Currency | Creating Insights
            </p>

          </div>

          <p className="brand-footer">
            Copyright © 2026 | RupAI
          </p>

        </div>

        {/* RIGHT PANEL */}
        <div className="login-right">

          <div className="login-content">

            <h2>Sign in</h2>

            <form onSubmit={handleSubmit}>

              {/* Email */}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              {/* Password */}
              <div className="password-wrapper">

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

              {/* Remember me */}
              <div className="login-options">

                <label>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                  />
                  Remember me
                </label>

                <Link href="/forgot-password">
                  Forgot Password?
                </Link>

              </div>

              {/* Buttons */}
              <div className="login-buttons">

                <button type="submit">
                  Sign In
                </button>

                <Link href="/signup">
                  New User
                </Link>

              </div>

            </form>

            {/* Terms */}
            <p className="login-terms">
              By registering, you agree to our
              <br />
              Terms of Use and Privacy Policy.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}
