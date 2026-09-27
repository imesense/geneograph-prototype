    sampleData.boards = [
      {
        id: 'gb1',
        projectId: 'p1',
        title: 'Whiskerfield family diagram',
        description: 'A genealogy-first visual diagram showing family relationships, research media and working annotations.',
        collectionIds: ['board-col-tree-design', 'board-col-research-theory'],
        modified: 'Aug 12, 2026',
        modifiedAt: '2026-08-12T12:00:00Z',
        createdAt: '2026-08-12T12:00:00Z',
        favorite: true,
        archived: false,
        thumb: 'tree',
        diagram: {
          canvas: {
            backgroundPaint: { color: '#0F1413', opacity: 100, enabled: true },
            backgroundPattern: 'dots',
            snapToGrid: false,
            alwaysShowSockets: false,
            colorPersonCardsByGender: false
          },
          personCardDefaults:
            geneoDefaultPersonCardSettings(),
          assets: [],
          people: [
            { id: 'gp-barnaby', treePersonId: 'barnaby', syncState: 'linked', names: { first: 'Barnaby', middle: '', last: 'Whiskerfield', maiden: '' }, gender: 'male', livingStatus: 'Deceased', birth: { ...normalizeGenealogyDateInput('14 Feb 1946'), placeId: null, placeText: '' }, death: { ...normalizeGenealogyDateInput('22 Nov 2018'), placeId: null, placeText: '' }, photoId: 'photo-barnaby-portrait' },
            { id: 'gp-daisy', treePersonId: 'daisy', syncState: 'linked', names: { first: 'Daisy', middle: '', last: 'Milkpaw', maiden: '' }, gender: 'female', livingStatus: 'Deceased', birth: { ...normalizeGenealogyDateInput('03 Jun 1949'), placeId: null, placeText: '' }, death: { ...normalizeGenealogyDateInput('04 Jan 2020'), placeId: null, placeText: '' }, photoId: 'photo-daisy-school' },
            { id: 'gp-silver', treePersonId: 'silver', syncState: 'linked', names: { first: 'Silver', middle: '', last: 'Whiskerfield', maiden: '' }, gender: 'male', livingStatus: 'Living', birth: { ...normalizeGenealogyDateInput('03 Mar 1998'), placeId: null, placeText: '' }, death: { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' }, photoId: 'photo-silver-portrait' },
            { id: 'gp-iris', treePersonId: null, syncState: 'local', names: { first: 'Iris', middle: '', last: 'Whiskerfield', maiden: '' }, gender: 'female', livingStatus: 'Living', birth: { ...normalizeGenealogyDateInput('2001'), placeId: null, placeText: '' }, death: { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' }, photoId: null },
            { id: 'gp-luna', treePersonId: 'luna', syncState: 'linked', names: { first: 'Luna', middle: '', last: 'Purrington', maiden: '' }, gender: 'female', livingStatus: 'Living', birth: { ...normalizeGenealogyDateInput('12 Aug 1999'), placeId: null, placeText: '' }, death: { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' }, photoId: 'photo-luna-portrait' },
            { id: 'gp-theo', treePersonId: null, syncState: 'local', names: { first: 'Theo', middle: '', last: 'Purrington', maiden: '' }, gender: 'male', livingStatus: 'Living', birth: { ...normalizeGenealogyDateInput('2023'), placeId: null, placeText: '' }, death: { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' }, photoId: null }
          ],
          families: [
            { id: 'gf-whiskerfield', partnerIds: ['gp-barnaby', 'gp-daisy'], children: [{ personId: 'gp-silver', parentageType: 'biological' }, { personId: 'gp-iris', parentageType: 'biological' }] },
            { id: 'gf-luna', partnerIds: ['gp-luna'], children: [{ personId: 'gp-theo', parentageType: 'biological' }] }
          ],
          nodes: [
            { id: 'gn-panel', type: 'panel', x: 170, y: 105, width: 1060, height: 620, parentPanelId: null, order: 1, visible: true, locked: false, title: 'Whiskerfield household', description: '', appearance: { fill: { color: '#132321', opacity: 68, enabled: true }, stroke: { color: '#3F6F61', opacity: 100, enabled: true }, strokeWidth: 2, strokePattern: 'dashed', text: { color: '#D9E8E2', opacity: 100, enabled: true } } },
            { id: 'gn-barnaby', type: 'person', personId: 'gp-barnaby', x: 270, y: 200, width: 300, height: 164, personCard: { heightMode: 'auto' }, parentPanelId: 'gn-panel', order: 6, visible: true, locked: false, appearance: { fill: { color: '#173029', opacity: 100, enabled: true }, stroke: { color: '#62D99A', opacity: 100, enabled: true }, strokeWidth: 2, strokePattern: 'solid', text: { color: '#F3F7F5', opacity: 100, enabled: true } } },
            { id: 'gn-daisy', type: 'person', personId: 'gp-daisy', x: 700, y: 200, width: 300, height: 164, personCard: { heightMode: 'auto' }, parentPanelId: 'gn-panel', order: 5, visible: true, locked: false, appearance: { fill: { color: '#2D2437', opacity: 100, enabled: true }, stroke: { color: '#AA8CE8', opacity: 100, enabled: true }, strokeWidth: 2, strokePattern: 'solid', text: { color: '#F6F1FB', opacity: 100, enabled: true } } },
            { id: 'gn-silver', type: 'person', personId: 'gp-silver', x: 350, y: 500, width: 300, height: 144, personCard: { heightMode: 'auto' }, parentPanelId: 'gn-panel', order: 4, visible: true, locked: false, appearance: { fill: { color: '#172A32', opacity: 100, enabled: true }, stroke: { color: '#5DADE2', opacity: 100, enabled: true }, strokeWidth: 2, strokePattern: 'solid', text: { color: '#F2F8FB', opacity: 100, enabled: true } } },
            { id: 'gn-iris', type: 'person', personId: 'gp-iris', x: 720, y: 500, width: 300, height: 144, personCard: { heightMode: 'auto' }, parentPanelId: 'gn-panel', order: 3, visible: true, locked: false, appearance: { fill: { color: '#302B1D', opacity: 100, enabled: true }, stroke: { color: '#D4AA6B', opacity: 100, enabled: true }, strokeWidth: 3, strokePattern: 'solid', text: { color: '#FFF8E8', opacity: 100, enabled: true } } },
            { id: 'gn-luna', type: 'person', personId: 'gp-luna', x: 1410, y: 230, width: 300, height: 144, personCard: { heightMode: 'auto' }, parentPanelId: null, order: 9, visible: true, locked: false, appearance: { fill: { color: '#2D2437', opacity: 100, enabled: true }, stroke: { color: '#AA8CE8', opacity: 100, enabled: true }, strokeWidth: 2, strokePattern: 'solid', text: { color: '#F6F1FB', opacity: 100, enabled: true } } },
            { id: 'gn-theo', type: 'person', personId: 'gp-theo', x: 1420, y: 520, width: 300, height: 144, personCard: { heightMode: 'auto' }, parentPanelId: null, order: 8, visible: true, locked: false, appearance: { fill: { color: '#19302C', opacity: 100, enabled: true }, stroke: { color: '#62D99A', opacity: 100, enabled: true }, strokeWidth: 2, strokePattern: 'solid', text: { color: '#F3F7F5', opacity: 100, enabled: true } } },
            {
              id: 'gn-image',
              type: 'image',
              x: 1850,
              y: 190,
              width: 300,
              height: 210,
              parentPanelId: null,
              order: 7,
              visible: true,
              locked: false,
              imageRef: {
                scope: 'project',
                id: 'photo-family-table'
              },
              appearance: {
                fill: { color: '#101817', opacity: 100, enabled: true },
                stroke: { color: '#6F7D79', opacity: 100, enabled: true },
                strokeWidth: 1,
                strokePattern: 'solid',
                text: { color: '#F1F5F3', opacity: 100, enabled: true }
              }
            },
            {
              id: 'gn-sticky',
              type: 'sticky',
              x: 1830,
              y: 500,
              width: 260,
              height: 180,
              parentPanelId: null,
              order: 6,
              visible: true,
              locked: false,

              text:
                'Compare the household register with the family album before exporting this branch.',

              textDelta: {
                ops: [
                  {
                    insert:
                      'Compare the household register with the family album before exporting this branch.'
                  },

                  {
                    insert: '\n'
                  }
                ]
              },

              textFormat:
                'quill-delta-v1',

              appearance: {
                fill: {
                  color: '#6B5525',
                  opacity: 100,
                  enabled: true
                },

                stroke: {
                  color: '#D4AA6B',
                  opacity: 100,
                  enabled: true
                },

                strokeWidth: 1,
                strokePattern: 'solid',

                text: {
                  color: '#FFF8E8',
                  opacity: 100,
                  enabled: true
                }
              }
            },
            {
              id: 'gn-text',
              type: 'text',
              x: 1330,
              y: 780,
              width: 420,
              height: 90,
              parentPanelId: null,
              order: 5,
              visible: true,
              locked: false,

              text: 'Possible Purrington branch',
              textDelta: {
                ops: [
                  {
                    insert:
                      'Possible Purrington branch'
                  },

                  {
                    insert: '\n',

                    attributes: {
                      header: 2
                    }
                  }
                ]
              },

              textFormat:
                'quill-delta-v1',

              appearance: {
                fill: {
                  color: '#18211F',
                  opacity: 100,
                  enabled: false
                },

                stroke: {
                  color: '#52615D',
                  opacity: 100,
                  enabled: false
                },

                strokeWidth: 1,
                strokePattern: 'solid',

                text: {
                  color: '#DBE8E4',
                  opacity: 100,
                  enabled: true
                },

                cornerRadius: 8,
              }
            }
          ],
          connections: [
            { id: 'gc-partner', kind: 'family-partner', familyId: 'gf-whiskerfield', source: { nodeId: 'gn-barnaby', port: 'right' }, target: { nodeId: 'gn-daisy', port: 'left' }, style: { pattern: 'solid', line: { color: '#D9E5E1', opacity: 100, enabled: true }, width: 3 }, route: { mode: 'auto', waypoints: [] } },
            { id: 'gc-child-silver', kind: 'family-child', familyId: 'gf-whiskerfield', source: { familyId: 'gf-whiskerfield', port: 'bottom' }, target: { nodeId: 'gn-silver', port: 'top' }, style: { pattern: 'solid', line: { color: '#8ECDB2', opacity: 100, enabled: true }, width: 2 }, route: { mode: 'auto', waypoints: [] } },
            { id: 'gc-child-iris', kind: 'family-child', familyId: 'gf-whiskerfield', source: { familyId: 'gf-whiskerfield', port: 'bottom' }, target: { nodeId: 'gn-iris', port: 'top' }, style: { pattern: 'solid', line: { color: '#8ECDB2', opacity: 100, enabled: true }, width: 2 }, route: { mode: 'auto', waypoints: [] } },
            { id: 'gc-single-parent', kind: 'family-child', familyId: 'gf-luna', source: { nodeId: 'gn-luna', port: 'bottom' }, target: { nodeId: 'gn-theo', port: 'top' }, style: { pattern: 'solid', line: { color: '#8ECDB2', opacity: 100, enabled: true }, width: 2 }, route: { mode: 'auto', waypoints: [] } },
            { id: 'gc-visual-solid', kind: 'visual', familyId: null, source: { nodeId: 'gn-image', port: 'bottom' }, target: { nodeId: 'gn-sticky', port: 'top' }, style: { pattern: 'solid', line: { color: '#D4AA6B', opacity: 100, enabled: true }, width: 2 }, route: { mode: 'manual', waypoints: [{ x: 2210, y: 440 }, { x: 2140, y: 440 }] } },
            { id: 'gc-visual-dashed', kind: 'visual', familyId: null, source: { nodeId: 'gn-sticky', port: 'left' }, target: { nodeId: 'gn-luna', port: 'right' }, style: { pattern: 'dashed', line: { color: '#AA8CE8', opacity: 100, enabled: true }, width: 2 }, route: { mode: 'auto', waypoints: [] } }
          ]
        }
      }
    ];
