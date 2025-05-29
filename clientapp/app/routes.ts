import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { redirect } from "react-router";

export default [
    route("", "routes/[lng]/page.tsx"),
    route("games/", "routes/[lng]/games/page.tsx"),
    route("games/:id/", "routes/[lng]/games/[id]/page.tsx"),

    route("about/", "routes/[lng]/about/page.tsx"),
    route("version/", "routes/[lng]/version/page.tsx"),

    route("profile/", "routes/[lng]/profile/page.tsx"),
    route("profile/password/", "routes/[lng]/profile/password/page.tsx"),

    route("login/", "routes/[lng]/login/page.tsx"),
    route("signup/", "routes/[lng]/signup/page.tsx"),

    route("admin", "routes/[lng]/admin/page.tsx"),
    route("admin/challenges", "routes/[lng]/admin/challenges/page.tsx"),
    route("admin/challenges/:challenge_id", "routes/[lng]/admin/challenges/[challenge_id]/page.tsx"),
    route("admin/challenges/create", "routes/[lng]/admin/challenges/create/page.tsx"),

    route("admin/games", "routes/[lng]/admin/games/page.tsx"),
    route("admin/games/:game_id", "routes/[lng]/admin/games/[game_id]/page.tsx"),

    route("admin/containers", "routes/[lng]/admin/containers/page.tsx"),
    route("admin/logs", "routes/[lng]/admin/logs/page.tsx"),
    route("admin/system", "routes/[lng]/admin/system/page.tsx"),
    route("admin/teams", "routes/[lng]/admin/teams/page.tsx"),
    route("admin/users", "routes/[lng]/admin/users/page.tsx"),
    
    // 创建404页面
    route("*", "routes/[lng]/404.tsx"),
    
    // // 捕获所有其他路径并重定向
    // route("*", "routes/notfound.tsx")
] satisfies RouteConfig;
