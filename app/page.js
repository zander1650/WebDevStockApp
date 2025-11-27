"use client"

import { useState } from "react";
import { Axios } from "axios";


export default function Home() {

  const APIKEY = "d4jpb8pr01qgcb0unq7gd4jpb8pr01qgcb0unq80";

  // Main functions Usestate for the searching and such
function app() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");

 const searchStock = async () =>  {
// If user enters nothing return (No point in calling API)
if (!ticker.trim()) return;
setLoading = (true);
setError = ("");
setData = (null);

 }
}
  return (

    <div> </div>
  );

  
}
