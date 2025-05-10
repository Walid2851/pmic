import { useEffect, useState } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set mobile breakpoint to 768px (typical tablet/mobile breakpoint)
      setIsMobile(window.innerWidth < 768)
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Call handler right away so state gets updated with initial window size
    handleResize()
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, []) // Empty array ensures effect is only run on mount

  return isMobile
}