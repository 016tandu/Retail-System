-- Keep hierarchy_control backward compatible with existing UI calls
-- while preserving new hierarchy rules.

CREATE OR REPLACE FUNCTION public.hierarchy_control(
    p_target_ma_nv character varying,
    p_action text,
    p_target_role text DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_my_role character varying;
    v_target_role character varying;
    v_resolved_target_role text;
BEGIN
    SELECT nv.role INTO v_my_role
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = auth.uid()
    LIMIT 1;

    IF v_my_role IS DISTINCT FROM 'Admin' THEN
        RAISE EXCEPTION 'Only Admin can change employee role hierarchy.';
    END IF;

    SELECT nv.role INTO v_target_role
    FROM public."NHAN_VIEN" nv
    WHERE nv."MaNV" = p_target_ma_nv
    LIMIT 1;

    IF v_target_role IS NULL THEN
        RAISE EXCEPTION 'Target employee not found: %', p_target_ma_nv;
    END IF;

    IF upper(p_action) = 'PROMOTE' THEN
        IF v_target_role = 'Staff' THEN
            IF p_target_role IS NULL OR p_target_role NOT IN ('Retailer', 'Provider', 'Admin') THEN
                RAISE EXCEPTION 'For Staff promotion, p_target_role must be Retailer, Provider, or Admin.';
            END IF;
            UPDATE public."NHAN_VIEN" SET role = p_target_role WHERE "MaNV" = p_target_ma_nv;
            RETURN;
        END IF;

        IF v_target_role IN ('Retailer', 'Provider') THEN
            -- Backward compatibility: legacy UI does not pass p_target_role.
            -- Default to Admin for these transitions.
            v_resolved_target_role := COALESCE(p_target_role, 'Admin');
            IF v_resolved_target_role <> 'Admin' THEN
                RAISE EXCEPTION 'Retailer/Provider can only be promoted to Admin.';
            END IF;
            UPDATE public."NHAN_VIEN" SET role = 'Admin' WHERE "MaNV" = p_target_ma_nv;
            RETURN;
        END IF;

        RAISE EXCEPTION 'Unsupported PROMOTE transition from role %.', v_target_role;
    END IF;

    IF upper(p_action) = 'DEMOTE' THEN
        IF v_target_role IN ('Retailer', 'Provider') THEN
            IF p_target_role IS NOT NULL AND p_target_role <> 'Staff' THEN
                RAISE EXCEPTION 'Retailer/Provider can only be demoted to Staff.';
            END IF;
            UPDATE public."NHAN_VIEN" SET role = 'Staff' WHERE "MaNV" = p_target_ma_nv;
            RETURN;
        END IF;

        RAISE EXCEPTION 'Only Retailer/Provider can be demoted to Staff.';
    END IF;

    RAISE EXCEPTION 'Unsupported action %, expected PROMOTE or DEMOTE.', p_action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
