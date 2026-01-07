export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const webhook=req.body.webhook||"https://discord.com/api/webhooks/1457877866577399841/gTQRwnsyE8m_Udwf--c4Q7p74UUGuLDdnC3gcNJ9fTYE6p2q-3HDpO0oQ_2PCOF65wrR";
    await fetch(webhook,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:req.body.message})});
    res.json({success:true});
  }catch(err){ res.status(500).json({error:"Webhook failed"}); }
}
