export async function callHelloAPI(){
    try{
      const res = await fetch("/api/hello");

      if(!res.ok){
        throw new Error(`HTTP error: ${res.status}`);
      }

      const data = await res.json();
      return data.message
    } catch(error) {
      console.log(error);
    }
  }