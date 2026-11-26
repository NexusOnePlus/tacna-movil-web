import java.net.URI

plugins {
    id("com.android.application") version "8.9.2"
}

android {
    namespace = "pro.glook.tacnamovil.rastreo"
    compileSdk = 35

    defaultConfig {
        applicationId = "pro.glook.tacnamovil.rastreo"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        val endpoint = providers.gradleProperty("rastreoEndpoint")
            .orElse("https://tacna-panel.glook.pro/api/rastreo").get()
        val url = URI(endpoint)
        require(url.scheme == "https" && url.host != null && url.userInfo == null)
        buildConfigField("String", "RASTREO_ENDPOINT", "\"$endpoint\"")
    }

    buildFeatures { buildConfig = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
