-- Moderators escalate an item to an admin (PRD 9.3, shortcut E). It lands in the
-- urgent tab with the moderator's note, and the claim is released.

alter type public.flag_source add value if not exists 'escalated';

create function public.escalate_item(kind public.target_type, target uuid, note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform app.require_staff();
  if char_length(coalesce(btrim(note), '')) < 3 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  insert into public.moderation_flags (target_type, target_id, source, priority, details)
  values (kind, target, 'escalated', 'urgent', jsonb_build_object('note', left(note, 500), 'by', auth.uid()));
  delete from public.queue_claims where target_type = kind and target_id = target;
  perform app.write_audit('escalate ' || kind, kind::text, target, null, null, note);
end;
$$;

revoke all on function public.escalate_item(public.target_type, uuid, text) from public, anon, authenticated;
grant execute on function public.escalate_item(public.target_type, uuid, text) to authenticated;
