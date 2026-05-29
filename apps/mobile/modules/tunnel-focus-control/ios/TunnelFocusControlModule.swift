import ExpoModulesCore
import FamilyControls
import ManagedSettings

public class TunnelFocusControlModule: Module {
    private let managedSettingsStore = ManagedSettingsStore(
        named: ManagedSettingsStore.Name("tunnel")
    )
    private let legacyManagedSettingsStore = ManagedSettingsStore()

    public func definition() -> ModuleDefinition {
        Name("TunnelFocusControl")

        AsyncFunction("getSelectionSummary") { () -> [String: Any] in
            guard #available(iOS 16.0, *) else {
                return [
                    "hasSelection": false,
                    "applicationCount": 0,
                    "categoryCount": 0,
                    "webDomainCount": 0
                ]
            }

            return TunnelSelectionStore.shared.summary()
        }

        AsyncFunction("clearSelection") { () -> [String: Any] in
            guard #available(iOS 16.0, *) else {
                return [
                    "hasSelection": false,
                    "applicationCount": 0,
                    "categoryCount": 0,
                    "webDomainCount": 0
                ]
            }

            TunnelSelectionStore.shared.clear()
            self.clearShieldSettings()

            return TunnelSelectionStore.shared.summary()
        }

        AsyncFunction("getAuthorizationStatus") { () async -> String in
            guard #available(iOS 16.0, *) else {
                return "unsupported"
            }

            return await self.currentAuthorizationStatus()
        }

        AsyncFunction("requestAuthorization") { () async -> String in
            guard #available(iOS 16.0, *) else {
                return "unsupported"
            }

            return await self.requestAuthorization()
        }

        View(TunnelFocusControlView.self) {
            Events("onSelectionChange")
        }

        AsyncFunction("applyShield") { () async -> String in
            guard #available(iOS 16.0, *) else {
                return "unsupported"
            }
            return await MainActor.run {
                let result = self.applyShield()
                print("[TunnelFocusControl] applyShield result: \(result)")
                return result
            }
        }

        AsyncFunction("clearShield") { () async -> String in
            guard #available(iOS 16.0, *) else {
                return "unsupported"
            }
            return await MainActor.run {
                print("[TunnelFocusControl] clearShield start")
                self.clearShieldSettings()
                print("[TunnelFocusControl] clearShield done")
                return "cleared"
            }
        }
    }
}

@available(iOS 16.0, *)
private extension TunnelFocusControlModule {
    func clearShieldSettings() {
        print("[TunnelFocusControl] clearShieldSettings: named + legacy stores")
        clearShield(in: managedSettingsStore)
        // Backward compatibility: clear possible leftovers from the unnamed store.
        clearShield(in: legacyManagedSettingsStore)
    }

    func clearShield(in store: ManagedSettingsStore) {
        store.shield.applications = nil
        store.shield.webDomains = nil
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil
        store.clearAllSettings()
    }

    func currentAuthorizationStatus() async -> String {
        #if targetEnvironment(simulator)
        return "unsupported"
        #else
        let status = await MainActor.run {
            AuthorizationCenter.shared.authorizationStatus
        }

        return mapAuthorizationStatus(status)
        #endif
    }

    func requestAuthorization() async -> String {
        #if targetEnvironment(simulator)
        return "unsupported"
        #else
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            return await currentAuthorizationStatus()
        } catch {
            print("FamilyControls requestAuthorization error: \(error)")

            let statusAfterError = await currentAuthorizationStatus()

            if statusAfterError == "notDetermined" {
                return "unknown"
            }

            return statusAfterError
        }
        #endif
    }

    func applyShield() -> String {
        let selection = TunnelSelectionStore.shared.selection

        guard hasSelection(selection) else {
            clearShieldSettings()
            return "noSelection"
        }

        clearShieldSettings()

        managedSettingsStore.shield.applications =
        selection.applicationTokens.isEmpty ? nil : selection.applicationTokens

        managedSettingsStore.shield.webDomains =
        selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens

        managedSettingsStore.shield.applicationCategories =
        selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens, except: [])

        managedSettingsStore.shield.webDomainCategories =
        selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens, except: [])

        return "applied"
    }

    func hasSelection(_ selection: FamilyActivitySelection) -> Bool {
        !selection.applicationTokens.isEmpty ||
        !selection.categoryTokens.isEmpty ||
        !selection.webDomainTokens.isEmpty
    }

    func mapAuthorizationStatus(_ status: AuthorizationStatus) -> String {
        switch status {
        case .notDetermined:
            return "notDetermined"
        case .denied:
            return "denied"
        case .approved:
            return "approved"
        @unknown default:
            return "unknown"
        }
    }
}
