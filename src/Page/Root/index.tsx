import OverlayHost from "@/Components/Layout/OverlayHost";
import Header from "@/Components/Layout/Header";
import ScrollTopButton from "@/Components/ScrollTopButton";
import { useAuthInit } from "@/hook/useAuthInit";
import { useRootUIShellStore } from "@/store/useRootUIShellStore";
import { Outlet } from "react-router";
import Footer from "@/Components/Layout/Footer";
import { useEffect, useRef, useState } from "react";
import supabase from "@/utils/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import MissionCompletePopup from "./Components/MissionCompletePopup";


type RewardPayload = {
  id: string;
  template_id: string;
  scope_id: string | null;
}


function Root() {
  const scrollTopButtonVisible = useRootUIShellStore(
    (s) => s.scrollTopButtonVisible
  );
  useAuthInit();

  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [queue, setQueue] = useState<RewardPayload[]>([]);
  const [currentCompleteMission, setCurrentCompleteMission] = useState<RewardPayload | null>(null);
  const handleIDs = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`user:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_rewards",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {

          const payloadData = payload.new as RewardPayload;
          console.log('payloadData ID : ', payloadData.id);

          if (handleIDs.current.has(payloadData.id)) return;
          handleIDs.current.add(payloadData.id);

          setQueue(q => [...q, payloadData]);

          queryClient.invalidateQueries({ queryKey: ["rewards", user.id] });
          queryClient.invalidateQueries({ queryKey: ["missions", user.id] });
        }
      )
      .subscribe();

    channelRef.current = ch;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, queryClient]);



  useEffect(() => {
    // 현재 완료 팝업이 없고 큐에 쌓인게 있는 경우
    if (!currentCompleteMission && queue.length > 0) {
      setCurrentCompleteMission(queue[0]);
      setQueue(q => q.slice(1));
    }

  }, [currentCompleteMission, queue.length])


  const handleClosePopup = async () => {
    const isbn13 = currentCompleteMission?.scope_id ?? null;
    if (isbn13) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["missions", "book", isbn13],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["rewards", user?.id],
          refetchType: "all",
        }),
      ]);
    } else {
      // achievement는 scope_id가 없어서 예외처리
      await queryClient.invalidateQueries({
        queryKey: ["rewards", user?.id],
        refetchType: "all",
      });
    }

    setCurrentCompleteMission(null);
  };


  return (
    <div className="min-h-screen w-full">
      {
        currentCompleteMission && currentCompleteMission.template_id &&
        <MissionCompletePopup
          isbn13={currentCompleteMission.scope_id ?? ''}
          missionCompletePopup={true}
          missionTemplateID={currentCompleteMission.template_id}
          onClose={handleClosePopup} />
      }

      <OverlayHost />
      <ScrollTopButton isVisible={scrollTopButtonVisible} />
      <Header />

      <div className="flex justify-center w-full">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}
export default Root;
