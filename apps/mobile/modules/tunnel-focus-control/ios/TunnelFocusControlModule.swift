import ExpoModulesCore
import FamilyControls
import ManagedSettings

public class TunnelFocusControlModule: Module {
    @available(iOS 16.0, *)
    static var currentSelection = FamilyActivitySelection()

    private let managedSettingsStore = ManagedSettingsStore(
        named: ManagedSettingsStore.Name("tunnel")
    )

    public func definition() -> ModuleDefinition {
        Name("TunnelFocusControl")

        AsyncFunction("getAuthorizationStatus") { () async -> String in
            guard #available(iOS 16.0, *) else {
                return "unsupported"
            }

            return await self.currentAuthorizationStatus()
        }

        AsyncFunction("requestAuthorization") { () async throws -> String in
            guard #available(iOS 16.0, *) else {
                return "unsupported"
            }

            return try await self.requestAuthorization()
        }

        View(TunnelFocusControlView.self) {
            Events("onSelectionChange")
        }

        AsyncFunction("applyShield") { () -> String in
            guard #available(iOS 16.0, *) else {
                return "unsupported"
            }

            return self.applyShield()
        }

        AsyncFunction("clearShield") { () -> String in
            self.managedSettingsStore.clearAllSettings()
            return "cleared"
        }
    }
}

@available(iOS 16.0, *)
private extension TunnelFocusControlModule {
    func currentAuthorizationStatus() async -> String {
        let status = await MainActor.run {
            AuthorizationCenter.shared.authorizationStatus
        }

        return mapAuthorizationStatus(status)
    }

    func requestAuthorization() async throws -> String {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            return await currentAuthorizationStatus()
        } catch {
            print("FamilyControls requestAuthorization error: \(error)")
            throw error
        }
    }

    func applyShield() -> String {
        let selection = TunnelFocusControlModule.currentSelection

        guard hasSelection(selection) else {
            managedSettingsStore.clearAllSettings()
            return "noSelection"
        }

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
        case .approvedWithDataAccess:
            return "approvedWithDataAccess"
        @unknown default:
            return "unknown"
        }
    }
}