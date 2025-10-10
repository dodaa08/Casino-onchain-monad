"use client";

import { useState } from "react";
import Connectbutton from "./Connectbutton";
import { useAccount } from "wagmi";

const Navbar = () => {
  const { address } = useAccount();
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReferralClick = () => {
    setIsReferralDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsReferralDialogOpen(false);
  };

  const handleGenerateLink = () => {
    // Placeholder for generating referral link
    if (address) {
      return `https://casino-onchain-monad.vercel.app/referral?ref=${address}`;
    }
    return "";
  };

  const handleCopyLink = () => {
    const link = handleGenerateLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="flex justify-center py-5 w-full border-b border-lime-900 bg-black/90">
        <div className="flex justify-between items-center w-full px-4">
          {/* Left side components */}
          <div className="flex items-center gap-6 text-sm">
            <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-lime-400/70">
                <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m0 17a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 12 19m1.6-5.7c-.76.44-.85.68-.85 1.2v.25a.75.75 0 0 1-1.5 0v-.25c0-1.33.64-2.02 1.6-2.58c.76-.44.85-.68.85-1.2a1.85 1.85 0 0 0-3.7 0a.75.75 0 0 1-1.5 0a3.35 3.35 0 1 1 5.4 2.7"/>
              </svg>
              <span>Support</span>
            </button>
            <button 
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              onClick={handleReferralClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-lime-400/70">
                <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m4 1h-1.26a7.004 7.004 0 0 1-5.48 0H8a5 5 0 0 0-5 5v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-1a5 5 0 0 0-5-5"/>
              </svg>
              <span>Referrals</span>
            </button>
          </div>  

          {/* Center components */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-lime-400/10 flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.35)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-lime-400">
                <rect x="4" y="4" width="16" height="16" rx="3" ry="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/>
                <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.3" fill="currentColor"/>
                <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"/>
                <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lime-400 tracking-widest text-lg font-bold" style={{ textShadow: "0 0 10px rgba(163, 230, 53, 0.7), 0 0 24px rgba(163, 230, 53, 0.45)" }}>
                Void.fun
              </h1>
            </div>
          </div>

          {/* Right side components */}
          <div className="flex items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-lime-400 flex items-center justify-center shadow-[0_0_12px_rgba(163,230,53,0.6)]">
                  <span className="text-black text-xs">☺</span>
                </div>
                <span className="text-lime-400 font-semibold">0.00</span>
              </div>

              <div className="mr-2">
                <Connectbutton />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Dialog */}
      {isReferralDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a]/95 border border-gray-800/60 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Referral Link</h2>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-300 mb-2">Share this link with friends to earn rewards from their deposits:</p>
              {address ? (
                <div className="bg-[#121a29] border border-gray-700/60 rounded-md p-3 flex items-center justify-between">
                  <p className="text-sm text-white truncate flex-1">{handleGenerateLink()}</p>
                  <button
                    onClick={handleCopyLink}
                    className="ml-2 px-3 py-1 bg-gray-700 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 italic">Connect your wallet to generate a referral link.</p>
              )}
            </div>
            <div className="flex justify-between items-center mb-4">
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded-md opacity-50 cursor-not-allowed"
                disabled
              >
                Claim Reward
              </button>
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;