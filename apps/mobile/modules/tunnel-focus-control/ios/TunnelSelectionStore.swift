import FamilyControls

final class TunnelSelectionStore{
    static let shared = TunnelSelectionStore()

    var selection = FamilyActivitySelection()

    private init(){}
}