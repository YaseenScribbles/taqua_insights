<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title inertia>{{ config("app.name", "Taqua Insights | An Insight to Taqua") }}</title>

        <!-- icon -->
         <link rel="shortcut icon" href="favicon.svg" type="image/svg">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Limelight&display=swap"
        />

        <!-- Scripts -->
        @routes @viteReactRefresh @vite(['resources/js/app.tsx',
        "resources/js/Pages/{$page['component']}.tsx"]) @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
