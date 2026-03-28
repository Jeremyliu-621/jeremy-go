import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function FriendDetailScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/frienddex", { replace: true });
  }, [navigate]);

  return null;
}
