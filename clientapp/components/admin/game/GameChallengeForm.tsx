import React from 'react';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Switch } from 'components/ui/switch';
import { FormField } from 'components/ui/form';
import { Layers2, FileUser, Pencil, Trash2, Users } from 'lucide-react';
import { AdminDetailGameChallenge } from 'utils/A1API';
import { challengeCategoryColorMap, challengeCategoryIcons } from 'utils/ClientAssets';

const colorMap: { [key: string]: string } = challengeCategoryColorMap;
const cateIcon: { [key: string]: any } = challengeCategoryIcons;

interface GameChallengeFormProps {
  control: any;
  index: number;
  form: any;
  gameData: AdminDetailGameChallenge;
  onEditChallenge: (index: number) => void;
  removeGameChallenge: (index: number) => void;
  handleDeleteTeamSolve: (challengeId: number) => void;
  handleClearAllSolves: (challengeId: number) => void;
}

/**
 * 单个题目卡片组件
 * 从 EditGameView.tsx 中分离, 负责展示 / 操作单个题目
 */
export function GameChallengeForm({
  control,
  index,
  form,
  gameData,
  onEditChallenge,
  removeGameChallenge,
  handleDeleteTeamSolve,
  handleClearAllSolves,
}: GameChallengeFormProps) {
  return (
    <div className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:scale-[1.02] hover:bg-card/80">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`p-2.5 rounded-xl bg-gradient-to-br ${
              colorMap[gameData.category?.toLowerCase() || 'misc'] ||
              'from-muted/40 to-muted/20'
            } flex-shrink-0`}
          >
            {cateIcon[gameData.category?.toLowerCase() || 'misc']}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {gameData.challenge_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-medium border-muted-foreground/30">
                {gameData.category?.toUpperCase() || 'MISC'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="flex-shrink-0 ml-3">
          <FormField
            control={control}
            name={`challenges.${index}.visible`}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">可见</span>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="p-1 rounded bg-blue-500/10">
            <Layers2 className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium">{gameData.cur_score}</span>
          <span className="text-xs">分数</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="p-1 rounded bg-green-500/10">
            <FileUser className="h-4 w-4 text-green-600" />
          </div>
          <span className="text-sm font-medium">{gameData.solve_count}</span>
          <span className="text-xs">解决</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 hover:bg-blue-500/10 hover:text-blue-600 transition-all duration-200"
          onClick={() => onEditChallenge(index)}
          title="编辑题目"
          type="button"
        >
          <Pencil className="h-4 w-4 mr-1" />
          编辑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 hover:bg-yellow-500/10 hover:text-yellow-600 transition-all duration-200"
          onClick={() => handleDeleteTeamSolve(gameData.challenge_id)}
          title="删除队伍解题记录"
          type="button"
        >
          <Users className="h-4 w-4 mr-1" />
          删队伍
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 hover:bg-orange-500/10 hover:text-orange-600 transition-all duration-200"
          onClick={() => handleClearAllSolves(gameData.challenge_id)}
          title="清空所有解题记录"
          type="button"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          清空
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          onClick={() => removeGameChallenge(index)}
          title="删除题目"
          type="button"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          删除
        </Button>
      </div>
    </div>
  );
} 