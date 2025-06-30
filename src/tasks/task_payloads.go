package tasks

type CreateTeamFlagPayload struct {
	FlagTemplate string
	TeamID       int64
	GameID       int64
	ChallengeID  int64
	TeamHash     string
	TeamName     string
}
