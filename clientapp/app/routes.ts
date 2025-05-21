import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    route(":lng/", "routes/[lng]/page.tsx"),
    route(":lng/games/", "routes/[lng]/games/page.tsx"),
    route(":lng/games/:id/", "routes/[lng]/games/[id]/page.tsx"),

    route(":lng/about/", "routes/[lng]/about/page.tsx"),
    route(":lng/version/", "routes/[lng]/version/page.tsx"),

    route(":lng/profile/", "routes/[lng]/profile/page.tsx"),
    route(":lng/profile/password/", "routes/[lng]/profile/password/page.tsx"),

    route(":lng/login/", "routes/[lng]/login/page.tsx"),
    route(":lng/signup/", "routes/[lng]/signup/page.tsx"),

    route(":lng/admin", "routes/[lng]/admin/page.tsx"),
    route(":lng/admin/challenges", "routes/[lng]/admin/challenges/page.tsx"),
    route(":lng/admin/challenges/:challenge_id", "routes/[lng]/admin/challenges/[challenge_id]/page.tsx"),
    route(":lng/admin/challenges/create", "routes/[lng]/admin/challenges/create/page.tsx"),

    route(":lng/admin/games", "routes/[lng]/admin/games/page.tsx"),
    route(":lng/admin/games/:game_id", "routes/[lng]/admin/games/[game_id]/page.tsx"),

    route(":lng/admin/containers", "routes/[lng]/admin/containers/page.tsx"),
    route(":lng/admin/logs", "routes/[lng]/admin/logs/page.tsx"),
    route(":lng/admin/system", "routes/[lng]/admin/system/page.tsx"),
    route(":lng/admin/teams", "routes/[lng]/admin/teams/page.tsx"),
    route(":lng/admin/users", "routes/[lng]/admin/users/page.tsx"),
] satisfies RouteConfig;
