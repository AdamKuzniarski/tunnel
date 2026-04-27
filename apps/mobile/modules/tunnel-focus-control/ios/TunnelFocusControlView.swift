import ExpoModulesCore
import SwiftUI
import FamilyControls

class TunnelFocusControlView: ExpoView {
  let onSelectionChange = EventDispatcher()
  private let hostingController: UIHostingController<SelectionPickerContainer>

  required init(appContext: AppContext? = nil) {
    self.hostingController = UIHostingController(
        rootView: SelectionPickerContainer(onSelectionChange: { _ in })
    )

    super.init(appContext: appContext)

    clipsToBounds = true
    backgroundColor = .clear

    hostingController.rootView = SelectionPickerContainer { [weak self] summary in
      self?.onSelectionChange(summary)
    }

    if let hostedView = hostingController.view {
      hostedView.backgroundColor = .clear
      addSubview(hostedView)
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    hostingController.view.frame = bounds
  }
}

@available(iOS 16.0, *)
struct SelectionPickerContainer: View {
  @State private var selection = FamilyActivitySelection()
  let onSelectionChange: ([String: Any]) -> Void

  var body: some View {
    FamilyActivityPicker(selection: $selection)
    .onAppear {
      sendSummary()
    }
    .onChange(of: selection) { _ in
      sendSummary()
    }
  }

  private func sendSummary() {
    let applicationCount = selection.applicationTokens.count
    let categoryCount = selection.categoryTokens.count
    let webDomainCount = selection.webDomainTokens.count

    let summary: [String: Any] = [
      "hasSelection": applicationCount > 0 || categoryCount > 0 || webDomainCount > 0,
      "applicationCount": applicationCount,
      "categoryCount": categoryCount,
      "webDomainCount": webDomainCount
    ]

    onSelectionChange(summary)
  }
}