import { useNavigate } from "react-router-dom";
import { CreateProjectDialog } from "@/components/dialogs/CreateProjectDialog";
import { useState, useEffect } from "react";

export default function CreateProjectPage() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      navigate("/projects");
    }
  }, [open, navigate]);

  return <CreateProjectDialog open={open} onOpenChange={setOpen} />;
}
