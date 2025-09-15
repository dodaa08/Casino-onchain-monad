import Navbar from "@/app/components/Navbar";
import Hero from "@/app/components/hero";
import Leaderboard from "@/app/components/leaderboard";

const LandingPage = ()=>{

    return (
        <>
        <div className="bg-black w-full h-max">
        
                 <Navbar />
            

            <div className="flex items-center min-h-[70vh]">

          <div className="flex-1 flex justify-center ml-70">
            <Hero />
          </div>

        <div className="">
            <Leaderboard />
          </div>

            </div>
          
        </div>
        </>
    )
}

export default LandingPage;
