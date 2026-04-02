import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Loader2, ArrowLeft, Video, FileText, Lock } from "lucide-react";

export default function CourseContent() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccessAndFetchContent = async () => {
      if (!auth.currentUser || !productId) {
        navigate("/login");
        return;
      }

      try {
        // Check if user has purchased this product
        const purchasesQ = query(
          collection(db, "purchases"),
          where("userId", "==", auth.currentUser.uid),
          where("productId", "==", productId),
          where("status", "==", "completed")
        );
        const purchasesSnapshot = await getDocs(purchasesQ);

        if (purchasesSnapshot.empty) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        setHasAccess(true);

        // Fetch product details
        const productDoc = await getDoc(doc(db, "products", productId));
        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() });
        }

        // Fetch content from subcollection
        const contentQ = query(collection(db, "products", productId, "content"));
        const contentSnapshot = await getDocs(contentQ);
        const contentData = contentSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        
        // Sort by order if available
        contentData.sort((a, b) => (a.order || 0) - (b.order || 0));
        setContent(contentData);

      } catch (error) {
        console.error("Error fetching course content:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(() => {
      checkAccessAndFetchContent();
    });

    return () => unsubscribe();
  }, [productId, navigate]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#e8e0d8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b3a4b]" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#e8e0d8] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h3>
          <p className="text-gray-600 mb-6">Você não possui acesso a este conteúdo. Adquira o produto para liberar.</p>
          <button 
            onClick={() => navigate("/courses")}
            className="w-full bg-[#1b3a4b] text-white py-3 rounded-lg font-bold hover:bg-[#234b61] transition-colors"
          >
            Ver Cursos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#e8e0d8] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-[#1b3a4b] mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar para o Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-8 border-b border-gray-100 bg-gray-50">
            <h1 className="text-3xl font-bold text-[#1b3a4b] mb-2">
              {product?.title?.pt || product?.title || 'Conteúdo do Curso'}
            </h1>
            <p className="text-gray-600">
              {product?.description?.pt || product?.description}
            </p>
          </div>
          
          <div className="p-8">
            {content.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum conteúdo disponível no momento. Em breve novidades!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {content.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-6 hover:border-[#b8975a] transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-yellow-50 p-3 rounded-lg flex-shrink-0">
                        {item.type === 'video' ? (
                          <Video size={24} className="text-[#b8975a]" />
                        ) : (
                          <FileText size={24} className="text-[#b8975a]" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600 mb-4">{item.description}</p>
                        
                        {item.type === 'video' && item.url && (
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            {/* Placeholder for video player. In a real app, use an iframe or video player component */}
                            <p className="text-gray-500 flex items-center gap-2">
                              <Video size={20} />
                              Vídeo: {item.url}
                            </p>
                          </div>
                        )}
                        
                        {item.type === 'document' && item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#f5f0eb] text-[#1b3a4b] px-4 py-2 rounded-lg font-medium hover:bg-[#e8e0d8] transition-colors"
                          >
                            <FileText size={18} />
                            Baixar Material
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
