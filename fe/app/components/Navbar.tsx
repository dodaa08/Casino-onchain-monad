import xicon from "@/public/xicon.png"
import Image from "next/image"

const Navbar = ()=>{
    return (
        <>
        <div className="flex justify-center py-5 w-full border-b border-lime-900 bg-black/90">
            <div className="flex justify-between items-center w-full px-4">
                {/*   Left side components  */}
                <div className="flex items-center gap-6 text-sm">
                    <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-lime-400/70">
                            <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m0 17a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 12 19m1.6-5.7c-.76.44-.85.68-.85 1.2v.25a.75.75 0 0 1-1.5 0v-.25c0-1.33.64-2.02 1.6-2.58c.76-.44.85-.68.85-1.2a1.85 1.85 0 0 0-3.7 0a.75.75 0 0 1-1.5 0a3.35 3.35 0 1 1 5.4 2.7"/>
                        </svg>
                        <span>Support</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-lime-400/70">
                            <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m4 1h-1.26a7.004 7.004 0 0 1-5.48 0H8a5 5 0 0 0-5 5v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-1a5 5 0 0 0-5-5"/>
                        </svg>
                        <span>Referrals</span>
                    </button>
                </div>  



                {/*  Center components  */}
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


                {/*  Right side components  */}
                <div className="flex items-center">
                    <div className="flex items-center gap-6">
                        <div className="">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-lime-400">
                                <path fill="currentColor" d="M22.54 0L14.37 8.71l9.62 13.29h-7.54l-5.33-7.08-6.25 7.08H0l8.67-9.82L0 0h7.88l4.8 6.67L18.67 0h3.87z"/>
                            </svg>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-lime-400 flex items-center justify-center shadow-[0_0_12px_rgba(163,230,53,0.6)]">
                                <span className="text-black text-xs">☺</span>
                            </div>
                            <span className="text-lime-400 font-semibold">0.00</span>
                        </div>

                        <div className="mr-2">
                            <button className="border border-lime-600 text-gray-200 px-3 py-1.5 rounded-lg hover:bg-lime-600/20 transition-colors"> Sign in </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

export default Navbar;