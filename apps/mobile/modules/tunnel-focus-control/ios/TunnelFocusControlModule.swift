import ExpoModulesCore
import FamilyControls

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


    }
}
