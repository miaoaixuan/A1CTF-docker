import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { redirect } from "react-router";

export default [
    route("", "routes/A1CTFMainPage.tsx"),
    route("games", "routes/games/UserGameList.tsx"),

    route("games/:id/:module", "routes/games/[id]/UserGameView.tsx"),

    route("about", "routes/about/SystemAboutPage.tsx"),
    route("version", "routes/version/SystemVersionPage.tsx"),

    route("profile/:action", "routes/profile/UserProfileSettings.tsx"),

    // 账户验证模块
    route("login", "routes/auth/UserLoginPage.tsx"),
    route("signup", "routes/auth/UserSignupPage.tsx"),
    route("email-verify", "routes/auth/EmailVerify.tsx"),
    route("forget-password", "routes/auth/ForgetPassword.tsx"),

    route("admin", "routes/admin/AdminPageMain.tsx"),
    route("admin/challenges", "routes/admin/challenges/AdminGetChallengeList.tsx"),
    route("admin/challenges/:challenge_id", "routes/admin/challenges/[challenge_id]/AdminChallengeManage.tsx"),
    route("admin/challenges/create", "routes/admin/challenges/create/AdminCreateChallenge.tsx"),

    route("admin/games", "routes/admin/games/AdminListGames.tsx"),
    route("admin/games/create", "routes/admin/games/create/CreateGame.tsx"),

    // 比赛管理
    route("admin/games/:game_id/:action", "routes/admin/games/[game_id]/GameSettings.tsx"),
    route("admin/games/:game_id/score-adjustments", "routes/admin/games/[game_id]/ScoreAdjustment.tsx"),

    route("admin/logs", "routes/admin/logs/SystemLogs.tsx"),

    // 系统设置
    route("admin/system/:action", "routes/admin/system/AdminSettingsPage.tsx"),

    route("admin/users", "routes/admin/users/AdminUserManage.tsx"),
    
    route("*", "routes/PageNotFound.tsx"),
    
    // // 捕获所有其他路径并重定向
    // route("*", "routes/PageNotFound.tsx")
    // route("*", "routes/notfound.tsx")
] satisfies RouteConfig;
