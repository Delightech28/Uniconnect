import React from 'react';
import AppHeader from './AppHeader';
import { useTheme } from '../hooks/useTheme';

const PostStats = ({ likes, comments }) => (
  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-600 dark:text-slate-400">
    <div className="flex items-center gap-4">
      <button className="flex items-center gap-1.5 hover:text-primary dark:hover:text-primary">
        <span className="material-symbols-outlined text-xl">thumb_up</span>
        <span className="text-sm font-medium">{likes}</span>
      </button>
      <button className="flex items-center gap-1.5 hover:text-primary dark:hover:text-primary">
        <span className="material-symbols-outlined text-xl">chat_bubble</span>
        <span className="text-sm font-medium">{comments}</span>
      </button>
    </div>
    <button className="flex items-center gap-1.5 hover:text-primary dark:hover:text-primary">
      <span className="material-symbols-outlined text-xl">share</span>
      <span className="text-sm font-medium">Share</span>
    </button>
  </div>
);

const Comment = ({ img, name, isAuthor, time, text, likes }) => (
  <div className="flex items-start gap-3">
    <img
      alt={`${name}'s profile picture`}
      className={`${isAuthor ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover shrink-0`}
      src={img}
    />
    <div className="flex-grow">
      <div className={`${isAuthor ? 'bg-slate-200 dark:bg-slate-700/50' : 'bg-background-light dark:bg-slate-800'} rounded-lg p-3`}>
        <p className="font-semibold text-secondary dark:text-white text-sm">
          {name} {isAuthor && <span className="ml-1 text-xs font-normal text-primary">(Author)</span>}
        </p>
        <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">{text}</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-2">
        <button className="hover:text-primary font-medium">Like</button>
        <span>·</span>
        <button className="hover:text-primary font-medium">Reply</button>
        <span>·</span>
        <span>{time}</span>
        {likes && (
          <div className="flex items-center gap-1 ml-auto">
            <span className={`material-symbols-outlined text-base ${likes > 5 ? 'text-primary' : 'text-slate-400'}`}>thumb_up</span>
            <span>{likes}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// --- Main App Component ---

export default function CampusFeed() {
  const { darkMode, toggleTheme } = useTheme();
  return (
    <div className="bg-background-light dark:bg-background-dark font-display">
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

          <main className="flex-1 px-4 sm:px-10 py-8">
            <div className="layout-content-container flex flex-col max-w-3xl mx-auto">
              {/* Page Title & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h1 className="text-secondary dark:text-white text-3xl font-bold leading-tight">CampusFeed</h1>
                <button className="flex items-center justify-center gap-2 h-10 px-4 mt-4 sm:mt-0 text-sm font-bold text-white bg-primary rounded-lg">
                  <span className="material-symbols-outlined">add</span>
                  <span>New Post</span>
                </button>
              </div>

              <div className="space-y-8">
                
                {/* Article 1 */}
                <article className="bg-white dark:bg-secondary rounded-xl shadow-md p-6">
                  {/* Post Header */}
                  <div className="flex items-start gap-4">
                    <img
                      alt="Chukwudi's profile picture"
                      className="w-12 h-12 rounded-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVKjqD0UUlZ-E-rgiu9IwYmbpz9BdG3CEMQEuHd49WNci_D7tLxeA20RyvQ29CMqpy1_BtTRGxmnvfsZsPBC4-QQz8_k8g4DoOPzm0-CBT6CrjvNud5--SU-scX8RRenq4aTlHIeQR842oI567QlAHTjqvK3jSvRpjtyuFId855Wj5E6MuiIy02KO4KY5JAAaSelDZiJlbC6O60TO8d9OFLxNE1R_oZMgF1iTcr8Rn5uuQ81HHAkM7E69-RGrXJPXmErrR9sNjagvI"
                    />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-secondary dark:text-white">Chukwudi Anene</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">UNILAG • 2 hours ago</p>
                        </div>
                        <button className="text-slate-500 dark:text-slate-400">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </div>
                      <div className="mt-4 text-slate-700 dark:text-slate-300 space-y-3">
                        <h2 className="text-xl font-bold text-secondary dark:text-white">The Hustle is Real: My Top 5 Side Gigs on Campus</h2>
                        <p>
                          Juggling lectures, assignments, and a social life is tough enough. Add 'being broke' to the mix, and you've got the classic Nigerian student experience. But fear
                          not! Here are my tried-and-tested side hustles that have kept my UniWallet from hitting zero...
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Post Stats */}
                  <PostStats likes="128" comments="42" />

                  {/* Comments Section */}
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-secondary dark:text-white mb-4">Comments (42)</h3>
                    
                    {/* Add Comment Input */}
                    <div className="flex items-start gap-3 mb-6">
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                        style={{
                          backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB7ipoCz1oXpOpPWDhv675AUHutItgtQM7aFzX0fh0jgdBvLu18QlYHkP0F9ptNxVjSL8c3CjKVBzKqa_0ddF2S584SR7N3hNfVN1wEpUrQbD-R1FEFUI295_ke_YUaiu8Ws2kQpWnucSO2RB5bJNXsnqp9jQy-5BDKmJQsxlsF50hUdrSyxbN6z-_pdvyDcSvAT5YaxfHhB8vzPRVfHJdStsyavQVcWMAi2j3wANMAlXCMc7EZufyPm5dcm8tH0DULaghvwkZ3-YAI")',
                        }}
                      ></div>
                      <div className="relative flex-grow">
                        <textarea
                          className="form-textarea w-full rounded-lg bg-background-light dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary text-secondary dark:text-white placeholder:text-slate-500"
                          placeholder="Add a comment..."
                          rows="2"
                        ></textarea>
                        <button className="absolute bottom-2 right-2 flex items-center justify-center h-8 px-3 text-sm font-bold text-white bg-primary rounded-md">
                          Post
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-5">
                      {/* Thread 1 */}
                      <div>
                        <Comment
                          img="https://lh3.googleusercontent.com/aida-public/AB6AXuAqjFAoqVT4QH6JOyFVUJM3RizFKS5dGD3Q9O-wN4DDpivWZ5CvPm-R__0LgjFLAQs4okklILDp7OMyJiDjwaO4XX25nVAKGsoF6NOp4YhpBBM51AZOwyyvpAA5HNJ5W7I6qX6bWmN5HLAPXOApYXF36IucZ1Js2CNTD4lXgHlHVKRWEElqOSH9tro0P2rKbmRqgMPUicbqru94lhHAE5j_zQ4e3w7sx9hLvQ-BIZ-wkyk95-BYH_X4YEiRmzknXM2XK1U6JXUvaOoo"
                          name="Aisha Bello"
                          text="Great list! Tutoring younger students in JAMB prep has been a lifesaver for me. Consistent income and you're helping someone out."
                          time="1h ago"
                          likes="12"
                        />
                        {/* Nested Reply */}
                        <div className="mt-4 pl-3">
                          <Comment
                            img="https://lh3.googleusercontent.com/aida-public/AB6AXuAFLWNUYNg73-0bamD1GDFYhHVgKt9mc48nUMOXhOETrp-7XED443xSDkTAQ870aBGzvaX_IfPk-ZBlwEoFuvT16pV2r4bIvC4oZ2AVhTfTxFUGCgXOvMiupF8tASayKOD0swnGw3UOrqKvsFGKfmkvkmv_7PQhjm05OeUCPG1LFsSgDAn--dNKlPV9LDHNvz_NPwcir1dv6Lp4uDZXFKJkU4nfubd40_4pp3ki5taXAGIrmylajiaeyStbmmcrtuk0bl32M3uThwJs"
                            name="Chukwudi Anene"
                            text="Solid suggestion Aisha! That's a great one to add."
                            time="55m ago"
                            isAuthor={true}
                          />
                        </div>
                      </div>

                      {/* Thread 2 */}
                      <div>
                        <Comment
                          img="https://lh3.googleusercontent.com/aida-public/AB6AXuB1p61QuSrz-Jowj8O5RXasfXJn8Z7dLQn2yTfyeHrEfpe_D0czr9iWCDpQn_EUcoOvvXV265DdZhmJVsQbb5eTSYaeJbcb8M-GmFkBKZZEnH_p8IncDdTB1Eges3EPwf5Oe6mo4Uf6uB-ssXqlYhKtDqYbIuRGJiPIQqy4rmDb2VpJ3QShSgcxWWTbEtmt_05kfqQBPp06YAOIzOZky5HG1iCvgsQRoAJ7p05qkhfvWHWGXOjCKGPFbMUdTcn0rgCZQuTje6onAbqW"
                          name="Femi Adeboye"
                          text="Anyone tried dropshipping using the marketplace? Seems like it could work."
                          time="45m ago"
                          likes="3"
                        />
                      </div>
                    </div>
                  </div>
                </article>

                {/* Article 2 */}
                <article className="bg-white dark:bg-secondary rounded-xl shadow-md p-6">
                  <div className="flex items-start gap-4">
                    <img
                      alt="Zainab's profile picture"
                      className="w-12 h-12 rounded-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-R9-xWgeHWyGUJ5Ct2z1vz1pU6SuJGCiNLfELgLlk4sr3mziaqDL04yfGFSXsZF0XQP5O3ZmQK_pjLEIgdGa31TWFai-4gAoLkcFOrGZT2_jqWAxps-Ma6QY2ptBfURQVd7ebqfaFbSGbkLsDUj12U8qcpTnCxcgG6zPMDWk2H4B1fSPCKswoejzagCaxvOSb1glsLXTsjmUNh1vRRzEUjlr8ilwgOgJHqhuYxKavTyeflxxUkKtm3fsmzRMPBE1-yCbr2xRdb0On"
                    />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-secondary dark:text-white">Zainab Aliyu</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">ABU Zaria • 1 day ago</p>
                        </div>
                        <button className="text-slate-500 dark:text-slate-400">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </div>
                      <div className="mt-4 text-slate-700 dark:text-slate-300 space-y-3">
                        <h2 className="text-xl font-bold text-secondary dark:text-white">Exam Season is Coming: Study Zone is a Game-Changer</h2>
                        <p>
                          The shared notes and past questions in the Study Zone for my department are honestly a lifesaver. If you're not using it, you're missing out. Shoutout to
                          everyone uploading material for CHM 201!
                        </p>
                        <img
                          alt="A stack of books on a desk."
                          className="rounded-lg mt-4 w-full h-auto max-h-80 object-cover"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_RCZyAAff1MRTqy1ribCt5T9QOBTdyQaYKB7oEfM0qN8VbyWJTssqItg_qCfvL73PRAiR6Fn-IoBU06KYuXKMSN2n9iS0RCUjDxW-2pks4B6D7U5xCX7K157zF1OmEqOtiCfe7UzE8dpMd2FMhG2r68VMC4Se5I45VPOcBcdhEZYxf5AwTjRqVG_wztHrLWz5W1Nq8cXkmDNif1S0LaEfk8LvdJQVfWUAMH6nWiwVQeBHprNkfl3PZWCD8u17VGe5CJXUDhPqgzDh"
                        />
                      </div>
                    </div>
                  </div>
                  <PostStats likes="251" comments="88" />
                </article>

              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}