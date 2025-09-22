import { useEffect, useState } from 'react';

function useLoader() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500); 
  
      return () => clearTimeout(timer);
    }, []); 

    return {
        loading
    }
}

export default useLoader
