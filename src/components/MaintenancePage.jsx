import React from "react";

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="bg-gradient-to-br from-green-400 to-green-600 dark:from-green-700 dark:to-green-800 p-8 flex items-center justify-center min-h-96 md:min-h-auto">
              <svg
                className="w-full h-full text-white opacity-90"
                fill="none"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Maintenance/Wrench Icon */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.2"
                />
                {/* Wrench */}
                <g transform="translate(60, 60)">
                  <path
                    d="M 20 40 Q 30 50 45 50 Q 55 50 60 40 L 70 30 Q 75 20 70 15 L 50 0 Q 45 -5 40 0 L 30 10 Q 20 20 20 40 Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <circle cx="25" cy="35" r="3" fill="white" />
                </g>
                {/* Gears */}
                <g opacity="0.7">
                  <circle
                    cx="140"
                    cy="60"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle
                    cx="140"
                    cy="60"
                    r="12"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                  />
                  <line
                    x1="140"
                    y1="40"
                    x2="140"
                    y2="48"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="140"
                    y1="72"
                    x2="140"
                    y2="80"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="160"
                    y1="60"
                    x2="168"
                    y2="60"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="112"
                    y1="60"
                    x2="120"
                    y2="60"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </g>
                {/* Loading animation lines */}
                <g opacity="0.6">
                  <line
                    x1="70"
                    y1="150"
                    x2="130"
                    y2="150"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="75"
                    y1="160"
                    x2="125"
                    y2="160"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="80"
                    y1="170"
                    x2="120"
                    y2="170"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </g>
              </svg>
            </div>

            {/* Content Section */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="text-center md:text-left">
                {/* Badge */}
                <div className="inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  🔧 Maintenance Mode
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                  We'll Be Back Soon
                </h1>

                {/* Subtitle */}
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  We're currently performing scheduled maintenance to bring you
                  a better experience on UniConnect. We appreciate your
                  patience.
                </p>

                {/* Details */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Performance Improvements
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        We're optimizing our platform for better speed and
                        reliability
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Enhanced Features
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Preparing exciting new features to enhance your
                        experience
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Security Updates
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Implementing security improvements to protect your data
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    Expected to be back online soon. Thank you for your
                    patience!
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    For support, contact us at{" "}
                    <a
                      href="mailto:support@uniconnect.com.ng"
                      className="text-green-600 dark:text-green-400 font-semibold hover:underline"
                    >
                      support@uniconnect.com.ng
                    </a>
                  </p>
                </div>

                {/* Loading Animation */}
                <div className="mt-8 flex justify-center md:justify-start gap-2">
                  <div
                    className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-600 dark:text-slate-400 text-sm">
          <p>UniConnect © 2026. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
