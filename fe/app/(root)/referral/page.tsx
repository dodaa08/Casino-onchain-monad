"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Connectbutton from "../../components/Connectbutton";
import { ConnectWallet } from "@/app/services/api";
import { toast } from "react-toastify";


// Referral page content component
const ReferralPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const referrer = searchParams.get("ref") || "";
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (referrer) {
      console.log("Referral address from URL:", referrer);
      // Store referrer in local storage for use during login
      localStorage.setItem("referrer", referrer);
    } else {
      // Clear any existing referrer if no ref parameter is present
      localStorage.removeItem("referrer");
    }
  }, [referrer]);

  useEffect(() => {
    if (isConnected && address) {
      console.log("Wallet connected:", address);
      // Prepare to send referral data to backend
      const storedReferrer = localStorage.getItem("referrer") || "";
      if (storedReferrer) {
        console.log("Sending referral data to backend:", { walletAddress: address, referrer: storedReferrer });
        sendReferralData(address, storedReferrer);
      } else {
        console.log("No referrer found, redirecting to home");
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    }
  }, [isConnected, address, router]);

  const sendReferralData = async (walletAddress: string, referrer: string) => {
    setIsLoading(true);
    try {
      const res = await ConnectWallet(walletAddress, referrer);
      console.log("[REFERRAL] ConnectWallet ->", res);
      if (res.data.success) {
        console.log("Referral data stored successfully, redirecting to home");
        toast.success("Referral Successfull, Now 5% of your staked amount will be shared with your referrer");
        setTimeout(() => {
          router.push('/');
        }, 4000);
      } else {
        console.error("Failed to store referral data:", res.data.message);
        // Still redirect to avoid blocking user
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    } catch (error) {
      console.error("Error sending referral data:", error);
      // Redirect even on error to avoid blocking user
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (referrer) {
      navigator.clipboard.writeText(referrer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSkipReferral = () => {
    console.log("Skipping referral, redirecting to home");
    localStorage.removeItem("referrer");
    

    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-4">
      <div className="bg-[#0b1206]/80 rounded-xl p-6 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-lime-400 mb-4">Welcome to Death Fun</h1>
        {referrer ? (
          <>
            <p className="text-gray-300 mb-4">You've been referred by a friend! Join now to start playing.</p>
            <div className="mb-6 bg-[#121a29] border border-gray-700/60 rounded-md p-3 inline-block max-w-full">
              <p className="text-sm text-gray-400 mb-1">Referral Source:</p>
              <p className="text-sm text-white truncate max-w-[250px] mx-auto">{referrer}</p>
              <button
                className="mt-2 px-3 py-1 bg-gray-700 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy Referral Info"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-300 mb-6">Join now to start playing Death Fun!</p>
        )}
        <div className="flex flex-col gap-4 mt-6">
          <div className="w-full flex gap-4 justify-center flex-col items-center">
            {isLoading ? (
              <p className="text-gray-300">Connecting wallet...</p>
            ) : (
              <Connectbutton />
            )}
          </div>
          <button
            className="px-4 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            onClick={handleSkipReferral}
          >
            Skip Referral and Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Main component with Suspense boundary
const ReferralPage = () => {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-4">
        <div className="bg-[#0b1206]/80 rounded-xl p-6 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-lime-400 mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <ReferralPageContent />
    </Suspense>
  );
};

export default ReferralPage;
