import { Outlet } from "react-router-dom";
import { useState } from "react";
import Header from "./Components/Hedder";
import Sidebar from "./Components/Sidebar";

function Layout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <style>{`
         * {
          
            box-sizing: border-box;
         }

         html, body, #root {
           height: 100%;
         }

         .layout {
           display: flex;
           height:100%;
           
            background-color: white;
         }

        

         .page-content {
           flex: 1;
           
           overflow-y: auto; 
           background-color: #fff;
        
           margin-left: 0;
           margin-top: 30px;
           margin-bottom:20px;

           border-top: 5px solid black;
           border-left: 5px solid black;
           transition: margin-left 0.3s ease;
         }

        
         header {
           position: fixed;
           top: 0;
           left: 0;
           right: 0;
           z-index: 1100;
           background: #fff;
           border-bottom: 1px solid #ccc;
           height: 60px;
         }

      `}</style>

      <Header />

      <div className="layout" style={{ paddingTop: "60px" }}>
        {/* Sidebar container for desktop width reserve */}
        <div className="sidebar-container">
          <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} role="admin" />
        </div>

        {/* Main content area */}
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default Layout;
