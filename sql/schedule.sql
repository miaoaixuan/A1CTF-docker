-- 实时计算解
UPDATE game_challenges gc
SET solve_count = (
    SELECT COUNT(*) 
    FROM solves s 
    WHERE s.game_id = gc.game_id AND s.challenge_id = gc.challenge_id AND s.solve_status = 1
)
WHERE gc.game_id IN (1, 2, 3);

-- 动态积分
UPDATE game_challenges gc
SET cur_score = FLOOR(
    gc.total_score * (
        ((gc.total_score - gc.minimal_score) / gc.total_score) + 
        (1 - ((gc.total_score - gc.minimal_score) / gc.total_score)) * 
        EXP((1 - gc.solve_count) / gc.difficulty)
    )
)
WHERE gc.game_id IN (1, 2, 3);
