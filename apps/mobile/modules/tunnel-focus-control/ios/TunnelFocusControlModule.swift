import ExpoModulesCore
import FamilyControls
import ManagedSettings

public class TunnelFocusControlModule: Module {
    @available(iOS 16.0, *)
    private func authorizationStatusString() async -> String {
        let status = await MainActor.run {
            AuthorizationCenter.shared.authorizationStatus
        }

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

    private let managedSettingsStore = ManagedSettingsStore(
        named: ManagedSettingsStore.Name("tunnel")
    )

    @available(iOS 16.0, *)
    private func requestAuthorizationInternal() async throws -> String {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        return await authorizationStatusString()
    }

    public func definition() -> ModuleDefinition {
        Name("TunnelFocusControl")

        AsyncFunction("getAuthorizationStatus") { () async -> String in
            guard #available(iOS 16.0, *) else {
                return "unsupported"
            }

            return await self.authorizationStatusString()
        }

        AsyncFunction("requestAuthorization") { () async throws -> String in
            guard #available(iOS 16.0, *) else {
                return "unsupported"
            }

            do {
                return try await self.requestAuthorizationInternal()
            } catch {
                print("FamilyControls requestAuthorization error: \(error)")
                throw error
            }
        }

        View(TunnelFocusControlView.self) {
            Events("onSelectionChange")
        }

        AsyncFunction("applyShield") { () -> String in
            guard #available(iOS 16.0, *) else {
                return "unsupported"
            }

            let selection = TunnelSelectionStore.shared.selection
            let hasSelection = !selection.applicationTokens.isEmpty || !selection.categoryTokens.isEmpty || !selection.webDomainTokens.isEmpty

            guard hasSelection else {
                managedSettingsStore.clearAllSettings()
                return "noSelection"
            }

            self.managedSettingsStore.shield.applications =
        selection.applicationTokens.isEmpty ? nil : selection.applicationTokens

            self.managedSettingsStore.shield.webDomainCategories =
        selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens

            self.managedSettingsStore.shield.applicationCategories =
        selection.applicationCategories.isEmpty ? nil: .specific(selection.categoryTokens, except: [])

            self.managedSettingsStore.shield.webDomainCategories =
        selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens, except: [])

            return "applied"
        }

        AsyncFunction("clearShield") { () -> String in
            self.managedSettingsStore.clearAllSettings()
            return "cleared"
        }
    }
}
