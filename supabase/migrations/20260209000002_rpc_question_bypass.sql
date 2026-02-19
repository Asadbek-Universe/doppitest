-- Create RPC function to bypass RLS for question creation
-- This function is called with appropriate permissions to avoid RLS restrictions

CREATE OR REPLACE FUNCTION create_question_rls_bypass(
  p_test_id UUID,
  p_question_text TEXT,
  p_explanation TEXT,
  p_topic TEXT,
  p_points INT,
  p_question_type TEXT,
  p_order_index INT
) RETURNS JSON AS $$
DECLARE
  v_question_id UUID;
  v_result JSON;
BEGIN
  -- Insert the question
  INSERT INTO public.questions (
    test_id,
    question_text,
    explanation,
    topic,
    points,
    question_type,
    order_index
  ) VALUES (
    p_test_id,
    p_question_text,
    p_explanation,
    p_topic,
    p_points,
    p_question_type,
    p_order_index
  ) RETURNING id INTO v_question_id;

  -- Return the inserted question
  SELECT row_to_json(q) INTO v_result
  FROM public.questions q
  WHERE q.id = v_question_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_question_rls_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION create_question_rls_bypass TO anon;
