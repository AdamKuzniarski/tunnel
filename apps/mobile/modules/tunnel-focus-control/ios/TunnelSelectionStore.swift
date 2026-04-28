import FamilyControls

@available(iOS 16.0, *)
final class TunnelSelectionStore {
    static let shared = TunnelSelectionStore()

    var selection = FamilyActivitySelection()

    private init() {}
}
