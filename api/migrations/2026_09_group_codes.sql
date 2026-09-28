-- Relabel existing accounts without changing their actual experimental condition.
-- Back up students.stu_id/group and ck_runs.cond before applying.
-- Safe to repeat: this derives the numeric label from the frozen run condition.
-- Accounts without a run and the next numeric allocation are left unchanged.
UPDATE students AS s
INNER JOIN ck_runs AS r ON r.stu_id=s.stu_id
SET s.`group`=CASE r.cond WHEN 'control' THEN '1' WHEN 'experiment' THEN '2' END
WHERE r.cond IN ('control','experiment')
  AND NOT (s.`group` <=> CASE r.cond WHEN 'control' THEN '1' WHEN 'experiment' THEN '2' END);
