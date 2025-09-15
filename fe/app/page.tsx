import LandingPage from "./(root)/Landing/page";
import WalletWraper from "./components/WalletWraper";

const Home = ()=>{
  return (
    <>
    <div>
      <WalletWraper>
      <LandingPage />
      </WalletWraper>
    </div>
    </>
  )
}
export default Home;