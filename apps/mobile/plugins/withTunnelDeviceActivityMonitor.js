const { withDangerousMod, withXcodeProject } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const targetName = "SessionMonitor";
const principalClassName = "TunnelDeviceActivityMonitor";
const activityName = "tunnel.focusSession";
const podfilePatchStart =
  "# @generated begin tunnel-device-activity-monitor-development-team";
const podfilePatchEnd =
  "# @generated end tunnel-device-activity-monitor-development-team";

const swiftSource = `import DeviceActivity
import Foundation
import ManagedSettings

private extension DeviceActivityName {
    static let tunnelFocusSession = Self("${activityName}")
}

@objc(${principalClassName})
final class ${principalClassName}: DeviceActivityMonitor {
    private let managedSettingsStore = ManagedSettingsStore(
        named: ManagedSettingsStore.Name("tunnel")
    )
    private let legacyManagedSettingsStore = ManagedSettingsStore()

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        guard activity == .tunnelFocusSession else {
            return
        }

        print("[TunnelDeviceActivityMonitor] intervalDidEnd clearing shield")
        clearShield(in: managedSettingsStore)
        clearShield(in: legacyManagedSettingsStore)
    }

    private func clearShield(in store: ManagedSettingsStore) {
        store.shield.applications = nil
        store.shield.webDomains = nil
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil
        store.clearAllSettings()
    }
}
`;

const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>CFBundleDevelopmentRegion</key>
\t<string>$(DEVELOPMENT_LANGUAGE)</string>
\t<key>CFBundleDisplayName</key>
\t<string>Tunnel Device Activity Monitor</string>
\t<key>CFBundleExecutable</key>
\t<string>$(EXECUTABLE_NAME)</string>
\t<key>CFBundleIdentifier</key>
\t<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
\t<key>CFBundleInfoDictionaryVersion</key>
\t<string>6.0</string>
\t<key>CFBundleName</key>
\t<string>$(PRODUCT_NAME)</string>
\t<key>CFBundlePackageType</key>
\t<string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
\t<key>CFBundleShortVersionString</key>
\t<string>$(MARKETING_VERSION)</string>
\t<key>CFBundleVersion</key>
\t<string>$(CURRENT_PROJECT_VERSION)</string>
\t<key>NSExtension</key>
\t<dict>
\t\t<key>NSExtensionPointIdentifier</key>
\t\t<string>com.apple.deviceactivity.monitor-extension</string>
\t\t<key>NSExtensionPrincipalClass</key>
\t\t<string>$(PRODUCT_MODULE_NAME).${principalClassName}</string>
\t</dict>
</dict>
</plist>
`;

const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.developer.family-controls</key>
    <true/>
  </dict>
</plist>
`;

function writeMonitorFiles(iosRoot) {
  const extensionRoot = path.join(iosRoot, targetName);
  fs.mkdirSync(extensionRoot, { recursive: true });
  fs.writeFileSync(
    path.join(extensionRoot, `${targetName}.swift`),
    swiftSource,
  );
  fs.writeFileSync(path.join(extensionRoot, "Info.plist"), infoPlist);
  fs.writeFileSync(
    path.join(extensionRoot, `${targetName}.entitlements`),
    entitlements,
  );
}

function buildPodfilePatch(developmentTeam) {
  return `${podfilePatchStart}
    installer.pods_project.targets.each do |target|
      next unless target.respond_to?(:product_type) && target.product_type == 'com.apple.product-type.bundle'

      target.build_configurations.each do |config|
        config.build_settings['DEVELOPMENT_TEAM'] = '${developmentTeam}'
      end
    end
${podfilePatchEnd}`;
}

function patchPodfile(iosRoot, developmentTeam) {
  if (!developmentTeam) {
    return;
  }

  const podfilePath = path.join(iosRoot, "Podfile");
  if (!fs.existsSync(podfilePath)) {
    return;
  }

  const podfile = fs.readFileSync(podfilePath, "utf8");
  const patch = buildPodfilePatch(developmentTeam);
  const patchPattern = new RegExp(
    `${podfilePatchStart}[\\s\\S]*?${podfilePatchEnd}`,
  );

  if (patchPattern.test(podfile)) {
    fs.writeFileSync(podfilePath, podfile.replace(patchPattern, patch));
    return;
  }

  const postInstallEnd = "\n  end\nend";
  if (!podfile.includes(postInstallEnd)) {
    throw new Error("Could not find the iOS Podfile post_install block.");
  }

  fs.writeFileSync(
    podfilePath,
    podfile.replace(postInstallEnd, `\n\n${patch}${postInstallEnd}`),
  );
}

function getBuildConfigurations(project, configurationListId) {
  const configurationList =
    project.pbxXCConfigurationList()[configurationListId];
  const buildConfigurations = configurationList.buildConfigurations.map(
    (entry) => entry.value,
  );

  return Object.entries(project.pbxXCBuildConfigurationSection()).filter(
    ([key, value]) => {
      return (
        !key.endsWith("_comment") &&
        buildConfigurations.includes(key) &&
        value.isa === "XCBuildConfiguration"
      );
    },
  );
}

function configureExtensionBuildSettings(
  project,
  target,
  bundleIdentifier,
  developmentTeam,
) {
  for (const [, configuration] of getBuildConfigurations(
    project,
    target.pbxNativeTarget.buildConfigurationList,
  )) {
    configuration.buildSettings = {
      ...configuration.buildSettings,
      APPLICATION_EXTENSION_API_ONLY: "YES",
      CLANG_ENABLE_MODULES: "YES",
      CODE_SIGN_ENTITLEMENTS: `${targetName}/${targetName}.entitlements`,
      CURRENT_PROJECT_VERSION: "1",
      ...(developmentTeam ? { DEVELOPMENT_TEAM: developmentTeam } : {}),
      INFOPLIST_FILE: `${targetName}/Info.plist`,
      IPHONEOS_DEPLOYMENT_TARGET: "16.0",
      LD_RUNPATH_SEARCH_PATHS: [
        '"$(inherited)"',
        '"@executable_path/Frameworks"',
        '"@executable_path/../../Frameworks"',
      ],
      MARKETING_VERSION: "1.0",
      PRODUCT_BUNDLE_IDENTIFIER: bundleIdentifier,
      PRODUCT_NAME: '"$(TARGET_NAME)"',
      SKIP_INSTALL: "YES",
      SWIFT_VERSION: "5.0",
      TARGETED_DEVICE_FAMILY: "1",
    };
  }
}

function ensureMainGroupChild(project, groupUuid) {
  const { firstProject } = project.getFirstProject();
  const mainGroup = project.getPBXGroupByKey(firstProject.mainGroup);
  const hasGroup = mainGroup.children.some(
    (child) => child.value === groupUuid || child.comment === targetName,
  );

  if (!hasGroup) {
    project.addToPbxGroup(groupUuid, firstProject.mainGroup);
  }
}

function ensureExtensionTarget(project, bundleIdentifier, developmentTeam) {
  const existingTarget = project.pbxTargetByName(targetName);

  if (existingTarget) {
    configureExtensionBuildSettings(
      project,
      { pbxNativeTarget: existingTarget },
      bundleIdentifier,
      developmentTeam,
    );
    return;
  }

  const target = project.addTarget(
    targetName,
    "app_extension",
    targetName,
    bundleIdentifier,
  );
  const group = project.addPbxGroup([], targetName, targetName, '"<group>"');
  ensureMainGroupChild(project, group.uuid);

  project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", target.uuid);
  project.addBuildPhase(
    [],
    "PBXFrameworksBuildPhase",
    "Frameworks",
    target.uuid,
  );
  project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", target.uuid);

  project.addSourceFile(
    `${targetName}.swift`,
    { target: target.uuid },
    group.uuid,
  );
  project.addFile("Info.plist", group.uuid);
  project.addFile(`${targetName}.entitlements`, group.uuid);
  configureExtensionBuildSettings(
    project,
    target,
    bundleIdentifier,
    developmentTeam,
  );
}

const withTunnelDeviceActivityMonitor = (config, options = {}) => {
  const developmentTeam = options.developmentTeam ?? config.ios?.appleTeamId;

  config = withDangerousMod(config, [
    "ios",
    (modConfig) => {
      writeMonitorFiles(modConfig.modRequest.platformProjectRoot);
      patchPodfile(modConfig.modRequest.platformProjectRoot, developmentTeam);
      return modConfig;
    },
  ]);

  return withXcodeProject(config, (modConfig) => {
    const bundleIdentifier = `${modConfig.ios?.bundleIdentifier}.${targetName}`;
    ensureExtensionTarget(
      modConfig.modResults,
      bundleIdentifier,
      developmentTeam,
    );
    return modConfig;
  });
};

module.exports = withTunnelDeviceActivityMonitor;
