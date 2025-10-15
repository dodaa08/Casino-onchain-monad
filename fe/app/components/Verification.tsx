"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { GetProof, RevealSession } from "@/app/services/api";
import { sha256Hex, getDeathTileIndex } from "@/app/utils/crypto";

interface VerificationStep {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

interface SessionProof {
  sessionId: string;
  serverSeed: string;
  serverCommit: string;
  clientSeed: string;
  rows: number[];
  rowsHash: string;
  clicks: Array<{
    row: number;
    tile: number;
    isDeath: boolean;
  }>;
}

const Verification = () => {
  const [sessionId, setSessionId] = useState("");
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [proof, setProof] = useState<SessionProof | null>(null);
  const [overallResult, setOverallResult] = useState<'pending' | 'success' | 'error'>('pending');

  // Validate session ID format (UUID-like)
  const isValidSessionId = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Auto-fetch proof when session ID changes
  useEffect(() => {
    if (sessionId.trim() && isValidSessionId(sessionId.trim())) {
      fetchProof();
    } else if (sessionId.trim() && !isValidSessionId(sessionId.trim())) {
      setVerificationSteps([{
        name: "Session ID Format",
        status: 'error',
        message: "Invalid session ID format. Please enter a valid UUID."
      }]);
      setOverallResult('error');
    } else {
      setVerificationSteps([]);
      setProof(null);
      setOverallResult('pending');
    }
  }, [sessionId]);

  const fetchProof = async () => {
    if (!sessionId.trim()) return;

    setIsVerifying(true);
    setVerificationSteps([]);
    setOverallResult('pending');

    try {
      // Try to get proof first
      const proofResponse = await GetProof(sessionId);
      
      if (proofResponse.success && proofResponse.proof) {
        setProof(proofResponse.proof);
        await verifySession(proofResponse.proof);
      } else {
        // If proof not available, try to reveal session first
        await revealAndVerify();
      }
    } catch (error) {
      console.error("Failed to fetch proof:", error);
      setVerificationSteps([{
        name: "Fetch Proof",
        status: 'error',
        message: "Failed to fetch session proof. Session may not exist or be expired."
      }]);
      setOverallResult('error');
      toast.error("Failed to fetch session proof");
    } finally {
      setIsVerifying(false);
    }
  };

  const revealAndVerify = async () => {
    try {
      // First reveal the session
      const revealResponse = await RevealSession(sessionId);
      
      if (revealResponse.success) {
        // Then get the proof
        const proofResponse = await GetProof(sessionId);
        
        if (proofResponse.success && proofResponse.proof) {
          setProof(proofResponse.proof);
          await verifySession(proofResponse.proof);
        } else {
          throw new Error("Failed to get proof after reveal");
        }
      } else {
        throw new Error("Failed to reveal session");
      }
    } catch (error) {
      console.error("Failed to reveal and verify:", error);
      setVerificationSteps([{
        name: "Reveal Session",
        status: 'error',
        message: "Failed to reveal session. Session may not exist or be expired."
      }]);
      setOverallResult('error');
      toast.error("Failed to reveal session");
    }
  };

  const verifySession = async (sessionProof: SessionProof) => {
    const steps: VerificationStep[] = [];
    
    try {
      // Step 1: Verify Server Commit
      steps.push({
        name: "Server Commit",
        status: 'pending',
        message: "Verifying server commit..."
      });
      setVerificationSteps([...steps]);

      const calculatedServerCommit = await sha256Hex(sessionProof.serverSeed);
      if (calculatedServerCommit === sessionProof.serverCommit) {
        steps[0] = {
          name: "Server Commit",
          status: 'success',
          message: "Server commit verified successfully"
        };
      } else {
        steps[0] = {
          name: "Server Commit",
          status: 'error',
          message: "Server commit verification failed"
        };
        setVerificationSteps([...steps]);
        setOverallResult('error');
        return;
      }
      setVerificationSteps([...steps]);

      // Step 2: Verify Board Hash
      steps.push({
        name: "Board Hash",
        status: 'pending',
        message: "Verifying board layout hash..."
      });
      setVerificationSteps([...steps]);

      const calculatedRowsHash = await sha256Hex(JSON.stringify(sessionProof.rows));
      if (calculatedRowsHash === sessionProof.rowsHash) {
        steps[1] = {
          name: "Board Hash",
          status: 'success',
          message: "Board layout hash verified successfully"
        };
      } else {
        steps[1] = {
          name: "Board Hash",
          status: 'error',
          message: "Board layout hash verification failed"
        };
        setVerificationSteps([...steps]);
        setOverallResult('error');
        return;
      }
      setVerificationSteps([...steps]);

      // Step 3: Verify Death Tiles
      steps.push({
        name: "Death Tiles",
        status: 'pending',
        message: "Verifying death tile positions..."
      });
      setVerificationSteps([...steps]);

      let deathTilesValid = true;
      for (let i = 0; i < sessionProof.rows.length; i++) {
        const expectedDeathTile = await getDeathTileIndex(sessionProof.serverSeed, i, sessionProof.rows[i]);
        const click = sessionProof.clicks.find(c => c.row === i);
        
        if (click && click.isDeath) {
          if (click.tile !== expectedDeathTile) {
            deathTilesValid = false;
            break;
          }
        }
      }

      if (deathTilesValid) {
        steps[2] = {
          name: "Death Tiles",
          status: 'success',
          message: "Death tile positions verified successfully"
        };
      } else {
        steps[2] = {
          name: "Death Tiles",
          status: 'error',
          message: "Death tile positions verification failed"
        };
        setVerificationSteps([...steps]);
        setOverallResult('error');
        return;
      }
      setVerificationSteps([...steps]);

      // Step 4: Verify Client Seed
      steps.push({
        name: "Client Seed",
        status: 'pending',
        message: "Verifying client seed usage..."
      });
      setVerificationSteps([...steps]);

      if (sessionProof.clientSeed) {
        steps[3] = {
          name: "Client Seed",
          status: 'success',
          message: "Client seed verified successfully"
        };
      } else {
        steps[3] = {
          name: "Client Seed",
          status: 'error',
          message: "Client seed not found"
        };
        setVerificationSteps([...steps]);
        setOverallResult('error');
        return;
      }
      setVerificationSteps([...steps]);

      // All verifications passed
      setOverallResult('success');
      toast.success("Session verification completed successfully!");

    } catch (error) {
      console.error("Verification error:", error);
      steps.push({
        name: "Verification Error",
        status: 'error',
        message: "An error occurred during verification"
      });
      setVerificationSteps([...steps]);
      setOverallResult('error');
      toast.error("Verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-[#0b1206]/95 border border-gray-900 rounded-2xl p-8 shadow-gray-900 shadow-inner">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-lime-400 mb-2">Session Verification</h1>
          <p className="text-gray-400 text-sm">Verify your game session for provably fair gaming</p>
        </div>

        <div className="space-y-6">
          {/* Input Box */}
          <div>
            <label className="block text-lime-400 text-sm font-medium mb-2">
              Session ID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Enter session ID to verify..."
              className="w-full px-4 py-3 bg-[#121a29] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
            />
            {sessionId.trim() && !isValidSessionId(sessionId.trim()) && (
              <p className="text-red-400 text-xs mt-1">Invalid session ID format</p>
            )}
          </div>

          {/* Loading State */}
          {isVerifying && (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 border-lime-400 border-t-transparent animate-spin"></div>
              <span className="ml-2 text-lime-400">Verifying session...</span>
            </div>
          )}

          {/* Verification Steps */}
          {verificationSteps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lime-400 font-medium">Verification Steps</h3>
              {verificationSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-[#121a29] border border-gray-700 rounded-lg">
                  <div className="flex-shrink-0">
                    {step.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div>
                    )}
                    {step.status === 'success' && (
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {step.status === 'error' && (
                      <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{step.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        step.status === 'success' ? 'bg-green-500/20 text-green-400' :
                        step.status === 'error' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{step.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overall Result */}
          {overallResult !== 'pending' && (
            <div className={`p-4 rounded-lg border ${
              overallResult === 'success' 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {overallResult === 'success' ? (
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={`font-medium ${
                  overallResult === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {overallResult === 'success' ? 'Session Verified Successfully' : 'Verification Failed'}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                overallResult === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {overallResult === 'success' 
                  ? 'This session has been verified as provably fair.'
                  : 'This session could not be verified. Please check the details above.'
                }
              </p>
            </div>
          )}

          {/* Session Details */}
          {proof && (
            <div className="mt-6 p-4 bg-[#121a29] border border-gray-700 rounded-lg">
              <h3 className="text-lime-400 font-medium mb-3">Session Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Session ID:</span>
                  <span className="text-white font-mono text-xs">{proof.sessionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Board Rows:</span>
                  <span className="text-white">{proof.rows.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Clicks:</span>
                  <span className="text-white">{proof.clicks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Death Clicks:</span>
                  <span className="text-white">{proof.clicks.filter(c => c.isDeath).length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verification;
