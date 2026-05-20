const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

const withNetworkSecurity = (config) => {
  // Добавляем networkSecurityConfig в AndroidManifest
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults
    const mainApplication = androidManifest.manifest.application[0]
    mainApplication.$['android:networkSecurityConfig'] =
      '@xml/network_security_config'
    return config
  })

  // Копируем файл конфига
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/xml'
      )

      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true })
      }

      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">railway.app</domain>
        <domain includeSubdomains="true">up.railway.app</domain>
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </domain-config>
</network-security-config>`

      fs.writeFileSync(
        path.join(xmlDir, 'network_security_config.xml'),
        xmlContent
      )

      return config
    },
  ])

  return config
}

module.exports = withNetworkSecurity