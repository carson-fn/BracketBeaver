import { useState } from 'react'

function App() {
  const [message, setMessage] = useState({})

  async function callHelloAPI(){
    try{
      const res = await fetch("/api/hello");

      if(!res.ok){
        throw new Error(`HTTP error: ${res.status}`);
      }

      const data = await res.json();
      setMessage(data);
    } catch(error) {
      console.log(error);
    }
  }

  return (
    <>
        {message && message.message}
        <button onClick={callHelloAPI}>
          Call Hello API
        </button>
    </>
  )
}

export default App
