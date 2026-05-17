import FamilyControls
import Foundation

@available(iOS 16.0, *)
final class TunnelSelectionStore {
    static let shared = TunnelSelectionStore()

    private let userDefaultsKey = "tunnel.native.familyActivitySelection"
    private let encoder = PropertyListEncoder()
    private let decoder = PropertyListDecoder()

    private(set) var selection: FamilyActivitySelection

    private init() {
        self.selection = Self.loadSelection(
            userDefaultsKey: userDefaultsKey,
            decoder: decoder
        )
    }

    func update(_ nextSelection: FamilyActivitySelection) {
        selection = nextSelection
        persist(nextSelection)
    }

    func clear() {
        selection = FamilyActivitySelection()
        UserDefaults.standard.removeObject(forKey: userDefaultsKey)
    }

    func hasSelection() -> Bool {
        !selection.applicationTokens.isEmpty ||
        !selection.categoryTokens.isEmpty ||
        !selection.webDomainTokens.isEmpty
    }

    func summary() -> [String: Any] {
        let applicationCount = selection.applicationTokens.count
        let categoryCount = selection.categoryTokens.count
        let webDomainCount = selection.webDomainTokens.count

        return [
            "hasSelection": applicationCount > 0 || categoryCount > 0 || webDomainCount > 0,
            "applicationCount": applicationCount,
            "categoryCount": categoryCount,
            "webDomainCount": webDomainCount
        ]
    }

    private func persist(_ selection: FamilyActivitySelection) {
        do {
            let data = try encoder.encode(selection)
            UserDefaults.standard.set(data, forKey: userDefaultsKey)
        } catch {
            print("TunnelSelectionStore persist error: \(error)")
        }
    }

    private static func loadSelection(
    userDefaultsKey: String,
    decoder: PropertyListDecoder
    ) -> FamilyActivitySelection {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey) else {
            return FamilyActivitySelection()
        }

        do {
            return try decoder.decode(FamilyActivitySelection.self, from: data)
        } catch {
            print("TunnelSelectionStore load error: \(error)")
            return FamilyActivitySelection()
        }
    }
}