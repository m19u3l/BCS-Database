import express from "express";
const router = express.Router();
let attachments = [];

router.get("/", (req,res) => res.json(attachments));
router.post("/", (req,res) => {
    const id = attachments.length + 1;
    const file = { id, ...req.body };
    attachments.push(file);
    res.json(file);
});
router.delete("/:id",(req,res)=>{
    attachments = attachments.filter(f => f.id != req.params.id);
    res.json({ deleted: true });
});

export default router;
